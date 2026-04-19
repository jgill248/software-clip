import { sql } from "drizzle-orm";
import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  createDb,
  inspectMigrations,
  type MigrationState,
} from "@softclipai/db";
import { loadSoftclipEnvFile } from "../config/env.js";
import { resolveConfigPath } from "../config/store.js";
import { resolveDbUrl } from "../config/db-url.js";

type DbDoctorOptions = {
  config?: string;
  dbUrl?: string;
  json?: boolean;
};

type CloseableDb = ReturnType<typeof createDb> & {
  $client?: { end?: (options?: { timeout?: number }) => Promise<void> };
};

/**
 * Tables we surface row counts for. Deliberately narrow — these are the
 * signals a dev cares about when opening doctor ("does this DB have real
 * data, or is it fresh?"). Adding a table here has an ongoing cost; only
 * add if its count tells a human something useful at a glance.
 */
const INTERESTED_TABLES = [
  "companies",
  "agents",
  "issues",
  "invites",
] as const;

type DoctorReport = {
  source: string;
  url: string;
  version: string | null;
  migration: MigrationState | { status: "error"; error: string };
  tableCounts: Record<string, number | null>;
  warnings: string[];
};

type ExecuteInput = Parameters<CloseableDb["execute"]>[0];

async function queryScalar<T>(
  db: CloseableDb,
  query: ExecuteInput,
  key: string,
): Promise<T | null> {
  try {
    const rows = (await db.execute(query)) as unknown as Array<
      Record<string, T>
    >;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows[0]?.[key] ?? null;
  } catch {
    return null;
  }
}

async function readTableCount(
  db: CloseableDb,
  table: string,
): Promise<number | null> {
  // `table` is restricted to a compile-time allow-list (INTERESTED_TABLES).
  // Guard with an ident check anyway so a future refactor that feeds this
  // from dynamic input can't introduce SQL injection.
  if (!/^[a-z_][a-z0-9_]*$/i.test(table)) return null;
  const value = await queryScalar<number>(
    db,
    sql.raw(`SELECT count(*)::int AS value FROM "${table}"`),
    "value",
  );
  return typeof value === "number" ? value : null;
}

async function buildReport(
  url: string,
  source: string,
): Promise<DoctorReport> {
  const report: DoctorReport = {
    source,
    url,
    version: null,
    migration: { status: "error", error: "not checked" },
    tableCounts: {},
    warnings: [],
  };

  const db = createDb(url) as CloseableDb;
  try {
    report.version = await queryScalar<string>(
      db,
      sql`SELECT version() AS value`,
      "value",
    );

    for (const table of INTERESTED_TABLES) {
      report.tableCounts[table] = await readTableCount(db, table);
    }

    const canCreate = await queryScalar<boolean>(
      db,
      sql`SELECT has_database_privilege(current_database(), 'CREATE') AS value`,
      "value",
    );
    if (canCreate === false) {
      report.warnings.push(
        "connected user lacks CREATE privilege on this database",
      );
    }
  } finally {
    await db.$client?.end?.({ timeout: 5 }).catch(() => undefined);
  }

  try {
    report.migration = await inspectMigrations(url);
  } catch (err) {
    report.migration = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return report;
}

function formatTextReport(report: DoctorReport): string {
  const lines: string[] = [];
  lines.push(`${pc.bold("Connection")}`);
  lines.push(`  source:  ${pc.cyan(report.source)}`);
  if (report.version) {
    const short = report.version.split(" on ")[0] ?? report.version;
    lines.push(`  version: ${pc.dim(short)}`);
  }
  lines.push("");
  lines.push(`${pc.bold("Migrations")}`);
  if (report.migration.status === "error") {
    lines.push(`  ${pc.red("error")}: ${report.migration.error}`);
  } else if (report.migration.status === "upToDate") {
    lines.push(
      `  ${pc.green("up to date")} (${report.migration.appliedMigrations.length} applied, ${report.migration.tableCount} tables)`,
    );
  } else {
    lines.push(
      `  ${pc.yellow("needs migrations")} — ${report.migration.pendingMigrations.length} pending`,
    );
    for (const name of report.migration.pendingMigrations.slice(0, 5)) {
      lines.push(`    • ${name}`);
    }
    if (report.migration.pendingMigrations.length > 5) {
      lines.push(
        `    … ${report.migration.pendingMigrations.length - 5} more`,
      );
    }
  }
  lines.push("");
  lines.push(`${pc.bold("Rows")}`);
  for (const [table, count] of Object.entries(report.tableCounts)) {
    const rendered =
      count === null ? pc.dim("—") : pc.cyan(count.toLocaleString());
    lines.push(`  ${table.padEnd(10)} ${rendered}`);
  }
  if (report.warnings.length > 0) {
    lines.push("");
    lines.push(`${pc.bold("Warnings")}`);
    for (const warning of report.warnings) {
      lines.push(`  ${pc.yellow("!")} ${warning}`);
    }
  }
  return lines.join("\n");
}

/**
 * Exit with non-zero when the DB state isn't healthy, so doctor is useful in
 * CI. "Healthy" here means: migration state is `upToDate` AND no warnings
 * were recorded.
 */
function exitCodeFor(report: DoctorReport): number {
  if (report.migration.status === "error") return 2;
  if (report.migration.status === "needsMigrations") return 1;
  if (report.warnings.length > 0) return 1;
  return 0;
}

export async function dbDoctor(opts: DbDoctorOptions): Promise<void> {
  const configPath = resolveConfigPath(opts.config);
  loadSoftclipEnvFile(configPath);

  const resolved = resolveDbUrl(configPath, opts.dbUrl);
  if (!resolved) {
    if (opts.json) {
      console.log(
        JSON.stringify({
          ok: false,
          error:
            "No database connection configured. Run `softclip db connect` first.",
        }),
      );
    } else {
      p.log.error(
        `No database connection configured. Run ${pc.cyan("softclip db connect")} first.`,
      );
    }
    process.exitCode = 2;
    return;
  }

  const report = await buildReport(resolved.value, resolved.source);

  if (opts.json) {
    console.log(JSON.stringify(report));
  } else {
    process.stdout.write(formatTextReport(report) + "\n");
  }
  process.exitCode = exitCodeFor(report);
}
