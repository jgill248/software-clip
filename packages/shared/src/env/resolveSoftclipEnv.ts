/**
 * Resolve a Softclip environment variable.
 *
 * Returns the value of `SOFTCLIP_<name>` if set, else `undefined`.
 *
 * Usage:
 *   const publicUrl = resolveSoftclipEnv("PUBLIC_URL")?.value;
 *   const allowed = resolveSoftclipEnv("ALLOWED_HOSTNAMES")?.value;
 */

export type ResolvedSoftclipEnv = {
  value: string;
  /** The full env var name that supplied the value, e.g. `SOFTCLIP_PUBLIC_URL`. */
  varName: string;
};

export function resolveSoftclipEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedSoftclipEnv | undefined {
  const varName = `SOFTCLIP_${name}`;
  const value = env[varName];
  if (value !== undefined) {
    return { value, varName };
  }
  return undefined;
}
