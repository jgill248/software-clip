import os from "node:os";
import path from "node:path";
import { resolveSoftclipEnv } from "@softclipai/shared";

const DEFAULT_INSTANCE_ID = "default";
const INSTANCE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const PATH_SEGMENT_RE = /^[a-zA-Z0-9_-]+$/;
const FRIENDLY_PATH_SEGMENT_RE = /[^a-zA-Z0-9._-]+/g;

function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

export function resolveSoftclipHomeDir(): string {
  const envHome = resolveSoftclipEnv("HOME")?.value.trim();
  if (envHome) return path.resolve(expandHomePrefix(envHome));
  return path.resolve(os.homedir(), ".softclip");
}

export function resolveSoftclipInstanceId(): string {
  const resolved = resolveSoftclipEnv("INSTANCE_ID");
  const raw = resolved?.value.trim() || DEFAULT_INSTANCE_ID;
  if (!INSTANCE_ID_RE.test(raw)) {
    throw new Error(`Invalid ${resolved?.varName ?? "SOFTCLIP_INSTANCE_ID"} '${raw}'.`);
  }
  return raw;
}

export function resolveSoftclipInstanceRoot(): string {
  return path.resolve(resolveSoftclipHomeDir(), "instances", resolveSoftclipInstanceId());
}

export function resolveDefaultConfigPath(): string {
  return path.resolve(resolveSoftclipInstanceRoot(), "config.json");
}

export function resolveDefaultEmbeddedPostgresDir(): string {
  return path.resolve(resolveSoftclipInstanceRoot(), "db");
}

export function resolveDefaultLogsDir(): string {
  return path.resolve(resolveSoftclipInstanceRoot(), "logs");
}

export function resolveDefaultSecretsKeyFilePath(): string {
  return path.resolve(resolveSoftclipInstanceRoot(), "secrets", "master.key");
}

export function resolveDefaultStorageDir(): string {
  return path.resolve(resolveSoftclipInstanceRoot(), "data", "storage");
}

export function resolveDefaultBackupDir(): string {
  return path.resolve(resolveSoftclipInstanceRoot(), "data", "backups");
}

export function resolveDefaultAgentWorkspaceDir(agentId: string): string {
  const trimmed = agentId.trim();
  if (!PATH_SEGMENT_RE.test(trimmed)) {
    throw new Error(`Invalid agent id for workspace path '${agentId}'.`);
  }
  return path.resolve(resolveSoftclipInstanceRoot(), "workspaces", trimmed);
}

function sanitizeFriendlyPathSegment(value: string | null | undefined, fallback = "_default"): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return fallback;
  const sanitized = trimmed
    .replace(FRIENDLY_PATH_SEGMENT_RE, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || fallback;
}

export function resolveManagedProjectWorkspaceDir(input: {
  productId: string;
  projectId: string;
  repoName?: string | null;
}): string {
  const productId = input.productId.trim();
  const projectId = input.projectId.trim();
  if (!productId || !projectId) {
    throw new Error("Managed project workspace path requires productId and projectId.");
  }
  return path.resolve(
    resolveSoftclipInstanceRoot(),
    "projects",
    sanitizeFriendlyPathSegment(productId, "company"),
    sanitizeFriendlyPathSegment(projectId, "project"),
    sanitizeFriendlyPathSegment(input.repoName, "_default"),
  );
}

export function resolveHomeAwarePath(value: string): string {
  return path.resolve(expandHomePrefix(value));
}
