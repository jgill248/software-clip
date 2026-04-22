import type { Company } from "@softclipai/shared";
import { api } from "./client";

export type CompanyStats = Record<string, { agentCount: number; issueCount: number }>;

export const companiesApi = {
  list: () => api.get<Company[]>("/products"),
  get: (productId: string) => api.get<Company>(`/products/${productId}`),
  stats: () => api.get<CompanyStats>("/products/stats"),
  create: (data: {
    name: string;
    description?: string | null;
    budgetMonthlyCents?: number;
  }) =>
    api.post<Company>("/products", data),
  update: (
    productId: string,
    data: Partial<
      Pick<
        Company,
        | "name"
        | "description"
        | "status"
        | "budgetMonthlyCents"
        | "feedbackDataSharingEnabled"
      >
    >,
  ) => api.patch<Company>(`/products/${productId}`, data),
  archive: (productId: string) => api.post<Company>(`/products/${productId}/archive`, {}),
  remove: (productId: string) => api.delete<{ ok: true }>(`/products/${productId}`),
};
