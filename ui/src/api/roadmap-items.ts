import type { Goal } from "@softclipai/shared";
import { api } from "./client";

export const goalsApi = {
  list: (productId: string) => api.get<Goal[]>(`/companies/${productId}/goals`),
  get: (id: string) => api.get<Goal>(`/goals/${id}`),
  create: (productId: string, data: Record<string, unknown>) =>
    api.post<Goal>(`/companies/${productId}/goals`, data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Goal>(`/goals/${id}`, data),
  remove: (id: string) => api.delete<Goal>(`/goals/${id}`),
};
