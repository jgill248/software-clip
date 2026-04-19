import type { SidebarOrderPreference, UpsertSidebarOrderPreference } from "@softclipai/shared";
import { api } from "./client";

export const sidebarPreferencesApi = {
  getCompanyOrder: () => api.get<SidebarOrderPreference>("/sidebar-preferences/me"),
  updateCompanyOrder: (data: UpsertSidebarOrderPreference) =>
    api.put<SidebarOrderPreference>("/sidebar-preferences/me", data),
  getProjectOrder: (productId: string) =>
    api.get<SidebarOrderPreference>(`/companies/${productId}/sidebar-preferences/me`),
  updateProjectOrder: (productId: string, data: UpsertSidebarOrderPreference) =>
    api.put<SidebarOrderPreference>(`/companies/${productId}/sidebar-preferences/me`, data),
};
