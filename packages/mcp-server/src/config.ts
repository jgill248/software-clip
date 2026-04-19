export interface SoftclipMcpConfig {
  apiUrl: string;
  apiKey: string;
  productId: string | null;
  agentId: string | null;
  runId: string | null;
}

function nonEmpty(value: string | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function normalizeApiUrl(apiUrl: string): string {
  const trimmed = stripTrailingSlash(apiUrl.trim());
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function readConfigFromEnv(env: NodeJS.ProcessEnv = process.env): SoftclipMcpConfig {
  const apiUrl = nonEmpty(env.SOFTCLIP_API_URL);
  if (!apiUrl) {
    throw new Error("Missing SOFTCLIP_API_URL");
  }
  const apiKey = nonEmpty(env.SOFTCLIP_API_KEY);
  if (!apiKey) {
    throw new Error("Missing SOFTCLIP_API_KEY");
  }

  return {
    apiUrl: normalizeApiUrl(apiUrl),
    apiKey,
    productId: nonEmpty(env.SOFTCLIP_COMPANY_ID),
    agentId: nonEmpty(env.SOFTCLIP_AGENT_ID),
    runId: nonEmpty(env.SOFTCLIP_RUN_ID),
  };
}
