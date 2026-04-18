import { sql } from "drizzle-orm";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { createDb } from "@paperclipai/db";
import { loadPaperclipEnvFile } from "../config/env.js";
import { readConfig, resolveConfigPath, writeConfig } from "../config/store.js";
import type { PaperclipConfig } from "../config/schema.js";

type DbConnectOptions = {
  config?: string;
  url?: string;
  host?: string;
  port?: number | string;
  database?: string;
  user?: string;
  password?: string;
  yes?: boolean;
  skipMigrate?: boolean;
};

type CloseableDb = ReturnType<typeof createDb> & {
  $client?: { end?: (options?: { timeout?: number }) => Promise<void> };
};

function buildUrlFromParts(parts: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}): string {
  const encodedUser = encodeURIComponent(parts.user);
  const encodedPassword = encodeURIComponent(parts.password);
  const auth =
    parts.password.length > 0
      ? `${encodedUser}:${encodedPassword}`
      : encodedUser;
  return `postgres://${auth}@${parts.host}:${parts.port}/${parts.database}`;
}

function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return url;
  }
}

async function closeDb(db: CloseableDb): Promise<void> {
  await db.$client?.end?.({ timeout: 5 }).catch(() => undefined);
}

type ProbeResult =
  | { ok: true; version: string; canCreate: boolean; isEmpty: boolean }
  | { ok: false; error: string };

/**
 * Open a connection, run the cheapest queries that verify the caller can
 * actually use the database, and close. Used by `db connect` to gate
 * writing the URL into config. Exported so tests can exercise the probe
 * against a fixture Postgres without driving the interactive prompt flow.
 */
export async function probeDatabase(url: string): Promise<ProbeResult> {
  let db: CloseableDb | null = null;
  try {
    db = createDb(url) as CloseableDb;
    const versionRow = await db.execute(sql`SELECT version() AS version`);
    const version = String(
      (versionRow as unknown as Array<{ version?: unknown }>)[0]?.version ??
        "",
    );

    const privRow = await db.execute(
      sql`SELECT has_database_privilege(current_database(), 'CREATE') AS can_create`,
    );
    const canCreate = Boolean(
      (privRow as unknown as Array<{ can_create?: unknown }>)[0]?.can_create,
    );

    const tableCountRow = await db.execute(
      sql`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const tableCount = Number(
      (tableCountRow as unknown as Array<{ count?: unknown }>)[0]?.count ?? 0,
    );

    return { ok: true, version, canCreate, isEmpty: tableCount === 0 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (db) await closeDb(db);
  }
}

async function promptConnectionParts(
  current?: PaperclipConfig,
): Promise<string | null> {
  const currentUrl =
    current?.database.mode === "postgres" ? current.database.connectionString : undefined;

  const mode = await p.select({
    message: "How do you want to specify the connection?",
    options: [
      {
        value: "url" as const,
        label: "Connection string",
        hint: "postgres://user:pass@host:5432/db",
      },
      { value: "parts" as const, label: "Host / port / user / password" },
    ],
    initialValue: currentUrl ? ("url" as const) : ("parts" as const),
  });
  if (p.isCancel(mode)) return null;

  if (mode === "url") {
    const url = await p.text({
      message: "PostgreSQL connection string",
      defaultValue: currentUrl ?? "",
      placeholder: "postgres://user:pass@localhost:5432/softclip",
      validate: (value) => {
        if (!value) return "Connection string is required";
        if (!/^postgres(ql)?:\/\//.test(value))
          return "Must be a postgres:// or postgresql:// URL";
      },
    });
    if (p.isCancel(url)) return null;
    return url;
  }

  const host = await p.text({
    message: "Host",
    defaultValue: "localhost",
    placeholder: "localhost",
  });
  if (p.isCancel(host)) return null;

  const portValue = await p.text({
    message: "Port",
    defaultValue: "5432",
    placeholder: "5432",
    validate: (val) => {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 65535)
        return "Port must be an integer between 1 and 65535";
    },
  });
  if (p.isCancel(portValue)) return null;

  const database = await p.text({
    message: "Database name",
    defaultValue: "softclip",
    placeholder: "softclip",
    validate: (val) => (val.trim().length === 0 ? "Database is required" : undefined),
  });
  if (p.isCancel(database)) return null;

  const user = await p.text({
    message: "User",
    defaultValue: "softclip",
    placeholder: "softclip",
    validate: (val) => (val.trim().length === 0 ? "User is required" : undefined),
  });
  if (p.isCancel(user)) return null;

  const password = await p.password({
    message: "Password (leave blank for peer/trust auth)",
    mask: "*",
  });
  if (p.isCancel(password)) return null;

  return buildUrlFromParts({
    host: String(host || "localhost"),
    port: Number(portValue || 5432),
    database: String(database),
    user: String(user),
    password: String(password ?? ""),
  });
}

function mergePostgresMode(
  current: PaperclipConfig | null,
  connectionString: string,
): PaperclipConfig {
  // readConfig can return null (no file). In that case the caller should have
  // already bailed; this helper just re-types that narrowing for clarity.
  if (!current) {
    throw new Error(
      "No config found. Run `paperclipai onboard` first, then rerun `db connect`.",
    );
  }
  return {
    ...current,
    database: {
      ...current.database,
      mode: "postgres",
      connectionString,
    },
  };
}

export async function dbConnect(opts: DbConnectOptions): Promise<void> {
  const configPath = resolveConfigPath(opts.config);
  loadPaperclipEnvFile(configPath);
  const current = readConfig(configPath);
  if (!current) {
    p.log.error(
      `No config found at ${configPath}. Run ${pc.cyan("paperclipai onboard")} first.`,
    );
    process.exitCode = 1;
    return;
  }

  p.intro(pc.bgCyan(pc.black(" db connect ")));

  let url: string | null = opts.url?.trim() || null;

  if (!url && (opts.host || opts.user || opts.database)) {
    url = buildUrlFromParts({
      host: opts.host?.trim() || "localhost",
      port: Number(opts.port ?? 5432),
      database: opts.database?.trim() || "softclip",
      user: opts.user?.trim() || "softclip",
      password: opts.password ?? "",
    });
  }

  if (!url) {
    url = await promptConnectionParts(current);
    if (!url) {
      p.cancel("Cancelled.");
      process.exitCode = 1;
      return;
    }
  }

  if (current.database.mode === "embedded-postgres" && !opts.yes) {
    const confirm = await p.confirm({
      message: `This will switch from embedded-postgres to external PostgreSQL. Continue?`,
      initialValue: true,
    });
    if (p.isCancel(confirm) || !confirm) {
      p.cancel("Cancelled.");
      process.exitCode = 1;
      return;
    }
  }

  const probeSpinner = p.spinner();
  probeSpinner.start(`Testing connection to ${redactUrl(url)}`);
  const probe = await probeDatabase(url);
  if (!probe.ok) {
    probeSpinner.stop(pc.red("Connection failed"));
    p.log.error(probe.error);
    p.log.info(
      "Check the host is reachable, the credentials are correct, and the database exists.",
    );
    process.exitCode = 1;
    return;
  }
  probeSpinner.stop(pc.green("Connected"));

  p.log.message(pc.dim(probe.version.split(" on ")[0] ?? probe.version));
  if (!probe.canCreate) {
    p.log.warn(
      "The connected user lacks CREATE privilege on this database. Softclip migrations will fail without it.",
    );
  }
  if (!probe.isEmpty) {
    p.log.info(
      "Target database is non-empty. If this is a fresh install, point at an empty database instead — existing tables will be left untouched, but migrations may fail.",
    );
  }

  const updated = mergePostgresMode(current, url);
  writeConfig(updated, configPath);
  p.log.success(`Saved connection to ${pc.cyan(configPath)}`);

  if (opts.skipMigrate) {
    p.outro(
      `Done. Run ${pc.cyan("pnpm db:migrate")} when you're ready to apply migrations.`,
    );
    return;
  }

  const runMigrations =
    opts.yes ||
    (await (async () => {
      const answer = await p.confirm({
        message: "Run database migrations now?",
        initialValue: true,
      });
      if (p.isCancel(answer)) return false;
      return Boolean(answer);
    })());

  if (!runMigrations) {
    p.outro(
      `Done. Run ${pc.cyan("pnpm db:migrate")} when you're ready to apply migrations.`,
    );
    return;
  }

  const migrateSpinner = p.spinner();
  migrateSpinner.start("Applying migrations");
  try {
    const { applyPendingMigrations } = await import("@paperclipai/db");
    await applyPendingMigrations(url);
    migrateSpinner.stop(pc.green("Migrations applied"));
    p.outro(`Done. Run ${pc.cyan("paperclipai db doctor")} to verify.`);
  } catch (err) {
    migrateSpinner.stop(pc.red("Migration failed"));
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
