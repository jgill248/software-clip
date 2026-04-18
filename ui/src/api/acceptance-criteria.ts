import { api } from "./client";

export type AcceptanceCriterionStatus = "pending" | "met" | "waived";

export interface AcceptanceCriterion {
  id: string;
  issueId: string;
  text: string;
  status: AcceptanceCriterionStatus;
  orderIndex: number;
  waivedReason: string | null;
  createdByAgentId: string | null;
  createdByUserId: string | null;
  updatedByAgentId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptanceCriteriaSummary {
  total: number;
  met: number;
  waived: number;
  pending: number;
}

export interface AcceptanceCriteriaList {
  items: AcceptanceCriterion[];
  summary: AcceptanceCriteriaSummary;
}

export interface CreateAcceptanceCriterionInput {
  text: string;
  orderIndex?: number;
  status?: AcceptanceCriterionStatus;
}

export interface UpdateAcceptanceCriterionInput {
  text?: string;
  status?: AcceptanceCriterionStatus;
  orderIndex?: number;
  waivedReason?: string | null;
}

export const acceptanceCriteriaApi = {
  list: (issueId: string) =>
    api.get<AcceptanceCriteriaList>(`/issues/${issueId}/acceptance-criteria`),
  create: (issueId: string, input: CreateAcceptanceCriterionInput) =>
    api.post<AcceptanceCriterion>(
      `/issues/${issueId}/acceptance-criteria`,
      input,
    ),
  update: (id: string, patch: UpdateAcceptanceCriterionInput) =>
    api.patch<AcceptanceCriterion>(`/acceptance-criteria/${id}`, patch),
  delete: (id: string) => api.delete<void>(`/acceptance-criteria/${id}`),
};
