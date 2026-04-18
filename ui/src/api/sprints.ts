import { api } from "./client";

export type SprintState = "planned" | "active" | "closed";

export interface Sprint {
  id: string;
  companyId: string;
  name: string;
  goal: string | null;
  state: SprintState;
  startsAt: string | null;
  endsAt: string | null;
  activatedAt: string | null;
  closedAt: string | null;
  createdByAgentId: string | null;
  createdByUserId: string | null;
  updatedByAgentId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SprintIssueSummary {
  total: number;
  done: number;
  inProgress: number;
  remaining: number;
}

export interface CreateSprintInput {
  name: string;
  goal?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  state?: SprintState;
}

export const sprintsApi = {
  list: (companyId: string, filters: { state?: SprintState } = {}) => {
    const params = filters.state ? `?state=${encodeURIComponent(filters.state)}` : "";
    return api.get<Sprint[]>(`/companies/${companyId}/sprints${params}`);
  },
  getActive: (companyId: string) =>
    api.get<Sprint>(`/companies/${companyId}/sprints/active`),
  create: (companyId: string, input: CreateSprintInput) =>
    api.post<Sprint>(`/companies/${companyId}/sprints`, input),
  get: (id: string) => api.get<Sprint>(`/sprints/${id}`),
  update: (id: string, patch: UpdateSprintInput) =>
    api.patch<Sprint>(`/sprints/${id}`, patch),
  remove: (id: string) => api.delete<void>(`/sprints/${id}`),
  // Issues on a sprint come back with the full issue shape; the type is
  // intentionally `unknown[]` here so callers cast to whatever their page
  // already imports for issue rows. Keeps this client loose.
  listIssues: (sprintId: string) =>
    api.get<Array<Record<string, unknown>>>(`/sprints/${sprintId}/issues`),
  summary: (sprintId: string) =>
    api.get<SprintIssueSummary>(`/sprints/${sprintId}/summary`),
  assignIssue: (issueId: string, sprintId: string | null) =>
    api.post<void>(`/issues/${issueId}/sprint`, { sprintId }),
};
