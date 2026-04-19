import type {
  Agent,
  AgentDetail,
  AgentInstructionsBundle,
  AgentInstructionsFileDetail,
  AgentSkillSnapshot,
  AdapterEnvironmentTestResult,
  AgentKeyCreated,
  AgentRuntimeState,
  AgentTaskSession,
  AgentWakeupResponse,
  HeartbeatRun,
  Approval,
  AgentConfigRevision,
} from "@softclipai/shared";
import { isUuidLike, normalizeAgentUrlKey } from "@softclipai/shared";
import { ApiError, api } from "./client";

export interface AgentKey {
  id: string;
  name: string;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface AdapterModel {
  id: string;
  label: string;
}

export interface DetectedAdapterModel {
  model: string;
  provider: string;
  source: string;
  candidates?: string[];
}

export interface ClaudeLoginResult {
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  loginUrl: string | null;
  stdout: string;
  stderr: string;
}

export interface OrgNode {
  id: string;
  name: string;
  role: string;
  status: string;
  reports: OrgNode[];
}

export interface AgentHireResponse {
  agent: Agent;
  approval: Approval | null;
}

export interface AgentPermissionUpdate {
  canCreateAgents: boolean;
  canAssignTasks: boolean;
}

function withCompanyScope(path: string, productId?: string) {
  if (!productId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}productId=${encodeURIComponent(productId)}`;
}

function agentPath(id: string, productId?: string, suffix = "") {
  return withCompanyScope(`/agents/${encodeURIComponent(id)}${suffix}`, productId);
}

export const agentsApi = {
  list: (productId: string) => api.get<Agent[]>(`/companies/${productId}/agents`),
  org: (productId: string) => api.get<OrgNode[]>(`/companies/${productId}/org`),
  listConfigurations: (productId: string) =>
    api.get<Record<string, unknown>[]>(`/companies/${productId}/agent-configurations`),
  get: async (id: string, productId?: string) => {
    try {
      return await api.get<AgentDetail>(agentPath(id, productId));
    } catch (error) {
      // Backward-compat fallback: if backend shortname lookup reports ambiguity,
      // resolve using company agent list while ignoring terminated agents.
      if (
        !(error instanceof ApiError) ||
        error.status !== 409 ||
        !productId ||
        isUuidLike(id)
      ) {
        throw error;
      }

      const urlKey = normalizeAgentUrlKey(id);
      if (!urlKey) throw error;

      const agents = await api.get<Agent[]>(`/companies/${productId}/agents`);
      const matches = agents.filter(
        (agent) => agent.status !== "terminated" && normalizeAgentUrlKey(agent.urlKey) === urlKey,
      );
      if (matches.length !== 1) throw error;
      return api.get<AgentDetail>(agentPath(matches[0]!.id, productId));
    }
  },
  getConfiguration: (id: string, productId?: string) =>
    api.get<Record<string, unknown>>(agentPath(id, productId, "/configuration")),
  listConfigRevisions: (id: string, productId?: string) =>
    api.get<AgentConfigRevision[]>(agentPath(id, productId, "/config-revisions")),
  getConfigRevision: (id: string, revisionId: string, productId?: string) =>
    api.get<AgentConfigRevision>(agentPath(id, productId, `/config-revisions/${revisionId}`)),
  rollbackConfigRevision: (id: string, revisionId: string, productId?: string) =>
    api.post<Agent>(agentPath(id, productId, `/config-revisions/${revisionId}/rollback`), {}),
  create: (productId: string, data: Record<string, unknown>) =>
    api.post<Agent>(`/companies/${productId}/agents`, data),
  hire: (productId: string, data: Record<string, unknown>) =>
    api.post<AgentHireResponse>(`/companies/${productId}/agent-hires`, data),
  update: (id: string, data: Record<string, unknown>, productId?: string) =>
    api.patch<Agent>(agentPath(id, productId), data),
  updatePermissions: (id: string, data: AgentPermissionUpdate, productId?: string) =>
    api.patch<AgentDetail>(agentPath(id, productId, "/permissions"), data),
  instructionsBundle: (id: string, productId?: string) =>
    api.get<AgentInstructionsBundle>(agentPath(id, productId, "/instructions-bundle")),
  updateInstructionsBundle: (
    id: string,
    data: {
      mode?: "managed" | "external";
      rootPath?: string | null;
      entryFile?: string;
      clearLegacyPromptTemplate?: boolean;
    },
    productId?: string,
  ) => api.patch<AgentInstructionsBundle>(agentPath(id, productId, "/instructions-bundle"), data),
  instructionsFile: (id: string, relativePath: string, productId?: string) =>
    api.get<AgentInstructionsFileDetail>(
      agentPath(id, productId, `/instructions-bundle/file?path=${encodeURIComponent(relativePath)}`),
    ),
  saveInstructionsFile: (
    id: string,
    data: { path: string; content: string; clearLegacyPromptTemplate?: boolean },
    productId?: string,
  ) => api.put<AgentInstructionsFileDetail>(agentPath(id, productId, "/instructions-bundle/file"), data),
  deleteInstructionsFile: (id: string, relativePath: string, productId?: string) =>
    api.delete<AgentInstructionsBundle>(
      agentPath(id, productId, `/instructions-bundle/file?path=${encodeURIComponent(relativePath)}`),
    ),
  pause: (id: string, productId?: string) => api.post<Agent>(agentPath(id, productId, "/pause"), {}),
  resume: (id: string, productId?: string) => api.post<Agent>(agentPath(id, productId, "/resume"), {}),
  terminate: (id: string, productId?: string) => api.post<Agent>(agentPath(id, productId, "/terminate"), {}),
  remove: (id: string, productId?: string) => api.delete<{ ok: true }>(agentPath(id, productId)),
  listKeys: (id: string, productId?: string) => api.get<AgentKey[]>(agentPath(id, productId, "/keys")),
  skills: (id: string, productId?: string) =>
    api.get<AgentSkillSnapshot>(agentPath(id, productId, "/skills")),
  syncSkills: (id: string, desiredSkills: string[], productId?: string) =>
    api.post<AgentSkillSnapshot>(agentPath(id, productId, "/skills/sync"), { desiredSkills }),
  createKey: (id: string, name: string, productId?: string) =>
    api.post<AgentKeyCreated>(agentPath(id, productId, "/keys"), { name }),
  revokeKey: (agentId: string, keyId: string, productId?: string) =>
    api.delete<{ ok: true }>(agentPath(agentId, productId, `/keys/${encodeURIComponent(keyId)}`)),
  runtimeState: (id: string, productId?: string) =>
    api.get<AgentRuntimeState>(agentPath(id, productId, "/runtime-state")),
  taskSessions: (id: string, productId?: string) =>
    api.get<AgentTaskSession[]>(agentPath(id, productId, "/task-sessions")),
  resetSession: (id: string, taskKey?: string | null, productId?: string) =>
    api.post<void>(agentPath(id, productId, "/runtime-state/reset-session"), { taskKey: taskKey ?? null }),
  adapterModels: (productId: string, type: string) =>
    api.get<AdapterModel[]>(
      `/companies/${encodeURIComponent(productId)}/adapters/${encodeURIComponent(type)}/models`,
    ),
  detectModel: (productId: string, type: string) =>
    api.get<DetectedAdapterModel | null>(
      `/companies/${encodeURIComponent(productId)}/adapters/${encodeURIComponent(type)}/detect-model`,
    ),
  testEnvironment: (
    productId: string,
    type: string,
    data: { adapterConfig: Record<string, unknown> },
  ) =>
    api.post<AdapterEnvironmentTestResult>(
      `/companies/${productId}/adapters/${type}/test-environment`,
      data,
    ),
  invoke: (id: string, productId?: string) => api.post<HeartbeatRun>(agentPath(id, productId, "/heartbeat/invoke"), {}),
  wakeup: (
    id: string,
    data: {
      source?: "timer" | "assignment" | "on_demand" | "automation";
      triggerDetail?: "manual" | "ping" | "callback" | "system";
      reason?: string | null;
      payload?: Record<string, unknown> | null;
      idempotencyKey?: string | null;
    },
    productId?: string,
  ) => api.post<AgentWakeupResponse>(agentPath(id, productId, "/wakeup"), data),
  loginWithClaude: (id: string, productId?: string) =>
    api.post<ClaudeLoginResult>(agentPath(id, productId, "/claude-login"), {}),
  availableSkills: () =>
    api.get<{ skills: AvailableSkill[] }>("/skills/available"),
};

export interface AvailableSkill {
  name: string;
  description: string;
  isPaperclipManaged: boolean;
}
