/**
 * Resolve a Softclip environment variable, falling back to the legacy
 * `PAPERCLIP_<name>` form during the rename.
 *
 * Precedence:
 *   1. `SOFTCLIP_<name>` if set (no warning).
 *   2. `PAPERCLIP_<name>` if set (one-shot deprecation warning per name).
 *   3. `undefined`.
 *
 * The deprecation warning is emitted at most once per process per variable
 * name, so a long-running server with `PAPERCLIP_PUBLIC_URL` set in its
 * environment doesn't spam logs on every request.
 *
 * Usage:
 *   const publicUrl = resolveSoftclipEnv("PUBLIC_URL")?.value;
 *   const allowed = resolveSoftclipEnv("ALLOWED_HOSTNAMES")?.value;
 */

export type SoftclipEnvSource = "softclip" | "paperclip";

export type ResolvedSoftclipEnv = {
  value: string;
  source: SoftclipEnvSource;
  /** The full env var name that supplied the value, e.g. `SOFTCLIP_PUBLIC_URL`. */
  varName: string;
};

const warnedLegacyVars = new Set<string>();

type WarnFn = (message: string) => void;

let warnFn: WarnFn = (message) => {
  console.warn(message);
};

/**
 * Override the warning sink. Tests use this to capture deprecation messages
 * without polluting stderr; production callers should not need it.
 */
export function setSoftclipEnvWarnSink(fn: WarnFn | null): void {
  warnFn = fn ?? ((message) => console.warn(message));
}

/**
 * Reset the per-process "already warned" set. Tests use this to make each
 * case independent; production callers should not need it.
 */
export function resetSoftclipEnvWarnings(): void {
  warnedLegacyVars.clear();
}

export function resolveSoftclipEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedSoftclipEnv | undefined {
  const softclipVar = `SOFTCLIP_${name}`;
  const paperclipVar = `PAPERCLIP_${name}`;

  const softclipValue = env[softclipVar];
  if (softclipValue !== undefined) {
    return { value: softclipValue, source: "softclip", varName: softclipVar };
  }

  const paperclipValue = env[paperclipVar];
  if (paperclipValue !== undefined) {
    if (!warnedLegacyVars.has(paperclipVar)) {
      warnedLegacyVars.add(paperclipVar);
      warnFn(
        `[softclip] ${paperclipVar} is deprecated; rename to ${softclipVar}. ` +
          "The legacy name will continue to be honored during the Paperclip → Softclip rename.",
      );
    }
    return { value: paperclipValue, source: "paperclip", varName: paperclipVar };
  }

  return undefined;
}
