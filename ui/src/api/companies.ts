import type { Company } from "@softclipai/shared";
import { api } from "./client";

export type CompanyStats = Record<string, { agentCount: number; issueCount: number }>;

export const companiesApi = {
  list: () => api.get<Company[]>("/companies"),
  get: (productId: string) => api.get<Company>(`/companies/${productId}`),
  stats: () => api.get<CompanyStats>("/companies/stats"),
  create: (data: {
    name: string;
    description?: string | null;
    budgetMonthlyCents?: number;
  }) =>
    api.post<Company>("/companies", data),
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
  ) => api.patch<Company>(`/companies/${productId}`, data),
  archive: (productId: string) => api.post<Company>(`/companies/${productId}/archive`, {}),
  remove: (productId: string) => api.delete<{ ok: true }>(`/companies/${productId}`),
};
