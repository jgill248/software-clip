import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PaperclipConfig } from "../config/schema.js";
import { resolveDbUrl } from "../config/db-url.js";

function createTempConfigPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "softclip-db-url-"));
  return path.join(dir, "config.json");
}

function baseConfig(overrides?: Partial<PaperclipConfig["database"]>): PaperclipConfig {
  return {
    $meta: {
      version: 1,
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      source: "configure",
    },
    database: {
      mode: "embedded-postgres",
      embeddedPostgresDataDir: "/tmp/softclip-db",
      embeddedPostgresPort: 54329,
      backup: {
        enabled: true,
        intervalMinutes: 60,
        retentionDays: 30,
        dir: "/tmp/softclip-backups",
      },
      ...overrides,
    },
    logging: { mode: "file", logDir: "/tmp/softclip-logs" },
    server: {
      deploymentMode: "authenticated",
      exposure: "private",
      host: "0.0.0.0",
      port: 3100,
      allowedHostnames: [],
      serveUi: true,
    },
    auth: { baseUrlMode: "auto", disableSignUp: false },
    telemetry: { enabled: true },
    storage: {
      provider: "local_disk",
      localDisk: { baseDir: "/tmp/softclip-storage" },
      s3: {
        bucket: "paperclip",
        region: "us-east-1",
        prefix: "",
        forcePathStyle: false,
      },
    },
    secrets: {
      provider: "local_encrypted",
      strictMode: false,
      localEncrypted: { keyFilePath: "/tmp/softclip-secrets/master.key" },
    },
  };
}

function writeConfig(configPath: string, config: PaperclipConfig) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

describe("resolveDbUrl", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalEnv;
    }
  });

  it("prefers an explicit URL above all other sources", () => {
    const configPath = createTempConfigPath();
    writeConfig(configPath, baseConfig());
    process.env.DATABASE_URL = "postgres://env@host/env";

    const resolved = resolveDbUrl(
      configPath,
      "postgres://explicit@host/explicit",
    );
    expect(resolved).toEqual({
      value: "postgres://explicit@host/explicit",
      source: "explicit",
    });
  });

  it("falls back to DATABASE_URL when no explicit URL is given", () => {
    const configPath = createTempConfigPath();
    writeConfig(configPath, baseConfig());
    process.env.DATABASE_URL = "postgres://env@host/env";

    expect(resolveDbUrl(configPath)).toEqual({
      value: "postgres://env@host/env",
      source: "env:DATABASE_URL",
    });
  });

  it("uses config.database.connectionString when mode is postgres", () => {
    const configPath = createTempConfigPath();
    writeConfig(
      configPath,
      baseConfig({
        mode: "postgres",
        connectionString: "postgres://config@host/cfg",
      }),
    );

    expect(resolveDbUrl(configPath)).toEqual({
      value: "postgres://config@host/cfg",
      source: "config.database.connectionString",
    });
  });

  it("synthesises the embedded-postgres URL when mode is embedded-postgres", () => {
    const configPath = createTempConfigPath();
    writeConfig(
      configPath,
      baseConfig({ mode: "embedded-postgres", embeddedPostgresPort: 55555 }),
    );

    expect(resolveDbUrl(configPath)).toEqual({
      value: "postgres://paperclip:paperclip@127.0.0.1:55555/paperclip",
      source: "embedded-postgres@55555",
    });
  });

  it("returns null when no config is present and no other source matches", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "softclip-db-url-none-"));
    const configPath = path.join(dir, "config.json");
    // No file written; readConfig returns null.
    expect(resolveDbUrl(configPath)).toBeNull();
  });

  it("ignores an empty explicit URL and falls through to the next source", () => {
    const configPath = createTempConfigPath();
    writeConfig(
      configPath,
      baseConfig({
        mode: "postgres",
        connectionString: "postgres://config@host/cfg",
      }),
    );

    expect(resolveDbUrl(configPath, "   ")).toEqual({
      value: "postgres://config@host/cfg",
      source: "config.database.connectionString",
    });
  });
});
