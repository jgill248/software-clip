import fs from "node:fs";
import { softclipConfigSchema, type SoftclipConfig } from "@softclipai/shared";
import { resolveSoftclipConfigPath } from "./paths.js";

export function readConfigFile(): SoftclipConfig | null {
  const configPath = resolveSoftclipConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return softclipConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
