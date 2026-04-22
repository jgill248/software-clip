import type { DashboardSummary } from "@softclipai/shared";
import { api } from "./client";

export const dashboardApi = {
  summary: (productId: string) => api.get<DashboardSummary>(`/products/${productId}/dashboard`),
};
