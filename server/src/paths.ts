import fs from "node:fs";
import path from "node:path";
import { resolveSoftclipEnv } from "@softclipai/shared";
import { resolveDefaultConfigPath } from "./home-paths.js";

const SOFTCLIP_CONFIG_BASENAME = "config.json";
const SOFTCLIP_ENV_FILENAME = ".env";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, ".softclip", SOFTCLIP_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveSoftclipConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  const configFromEnv = resolveSoftclipEnv("CONFIG")?.value;
  if (configFromEnv) return path.resolve(configFromEnv);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveSoftclipEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveSoftclipConfigPath(overrideConfigPath)), SOFTCLIP_ENV_FILENAME);
}
