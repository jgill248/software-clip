import type {
  Project,
  ProjectWorkspace,
  WorkspaceOperation,
  WorkspaceRuntimeControlTarget,
} from "@softclipai/shared";
import { api } from "./client";
import { sanitizeWorkspaceRuntimeControlTarget } from "./workspace-runtime-control";

function withCompanyScope(path: string, productId?: string) {
  if (!productId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}productId=${encodeURIComponent(productId)}`;
}

function projectPath(id: string, productId?: string, suffix = "") {
  return withCompanyScope(`/projects/${encodeURIComponent(id)}${suffix}`, productId);
}

export const projectsApi = {
  list: (productId: string) => api.get<Project[]>(`/products/${productId}/projects`),
  get: (id: string, productId?: string) => api.get<Project>(projectPath(id, productId)),
  create: (productId: string, data: Record<string, unknown>) =>
    api.post<Project>(`/products/${productId}/projects`, data),
  update: (id: string, data: Record<string, unknown>, productId?: string) =>
    api.patch<Project>(projectPath(id, productId), data),
  listWorkspaces: (projectId: string, productId?: string) =>
    api.get<ProjectWorkspace[]>(projectPath(projectId, productId, "/workspaces")),
  createWorkspace: (projectId: string, data: Record<string, unknown>, productId?: string) =>
    api.post<ProjectWorkspace>(projectPath(projectId, productId, "/workspaces"), data),
  updateWorkspace: (projectId: string, workspaceId: string, data: Record<string, unknown>, productId?: string) =>
    api.patch<ProjectWorkspace>(
      projectPath(projectId, productId, `/workspaces/${encodeURIComponent(workspaceId)}`),
      data,
    ),
  controlWorkspaceRuntimeServices: (
    projectId: string,
    workspaceId: string,
    action: "start" | "stop" | "restart",
    productId?: string,
    target: WorkspaceRuntimeControlTarget = {},
  ) =>
    api.post<{ workspace: ProjectWorkspace; operation: WorkspaceOperation }>(
      projectPath(projectId, productId, `/workspaces/${encodeURIComponent(workspaceId)}/runtime-services/${action}`),
      sanitizeWorkspaceRuntimeControlTarget(target),
    ),
  controlWorkspaceCommands: (
    projectId: string,
    workspaceId: string,
    action: "start" | "stop" | "restart" | "run",
    productId?: string,
    target: WorkspaceRuntimeControlTarget = {},
  ) =>
    api.post<{ workspace: ProjectWorkspace; operation: WorkspaceOperation }>(
      projectPath(projectId, productId, `/workspaces/${encodeURIComponent(workspaceId)}/runtime-commands/${action}`),
      sanitizeWorkspaceRuntimeControlTarget(target),
    ),
  removeWorkspace: (projectId: string, workspaceId: string, productId?: string) =>
    api.delete<ProjectWorkspace>(projectPath(projectId, productId, `/workspaces/${encodeURIComponent(workspaceId)}`)),
  remove: (id: string, productId?: string) => api.delete<Project>(projectPath(id, productId)),
};
