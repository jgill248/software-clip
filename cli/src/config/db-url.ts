import { readConfig } from "./store.js";

/**
 * Resolves a Postgres connection string from (in order):
 *
 * 1. an explicit URL passed in by the caller
 * 2. the `DATABASE_URL` environment variable
 * 3. `config.database.connectionString` when `mode === "postgres"`
 * 4. a synthesised URL for the embedded-postgres instance when
 *    `mode === "embedded-postgres"`
 *
 * Returns `null` when none of the above applies. The `source` field is a
 * short human-readable tag useful for diagnostic output (`softclip db doctor`
 * reads this, for example).
 */
export type ResolvedDbUrl = {
  value: string;
  source:
    | "explicit"
    | "env:DATABASE_URL"
    | "config.database.connectionString"
    | `embedded-postgres@${number}`;
};

export const DEFAULT_EMBEDDED_POSTGRES_PORT = 54329;

export function resolveDbUrl(
  configPath?: string,
  explicitDbUrl?: string,
): ResolvedDbUrl | null {
  const explicit = explicitDbUrl?.trim();
  if (explicit) return { value: explicit, source: "explicit" };

  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl) return { value: envUrl, source: "env:DATABASE_URL" };

  const config = readConfig(configPath);
  if (
    config?.database.mode === "postgres" &&
    config.database.connectionString?.trim()
  ) {
    return {
      value: config.database.connectionString.trim(),
      source: "config.database.connectionString",
    };
  }

  if (config?.database.mode === "embedded-postgres") {
    const port = config.database.embeddedPostgresPort ?? DEFAULT_EMBEDDED_POSTGRES_PORT;
    return {
      value: embeddedPostgresUrl(port),
      source: `embedded-postgres@${port}`,
    };
  }

  return null;
}

export function embeddedPostgresUrl(port: number): string {
  return `postgres://softclip:softclip@127.0.0.1:${port}/softclip`;
}
