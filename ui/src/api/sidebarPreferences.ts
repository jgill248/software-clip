import type { SidebarOrderPreference, UpsertSidebarOrderPreference } from "@softclipai/shared";
import { api } from "./client";

export const sidebarPreferencesApi = {
  getCompanyOrder: () => api.get<SidebarOrderPreference>("/sidebar-preferences/me"),
  updateCompanyOrder: (data: UpsertSidebarOrderPreference) =>
    api.put<SidebarOrderPreference>("/sidebar-preferences/me", data),
  getProjectOrder: (productId: string) =>
    api.get<SidebarOrderPreference>(`/products/${productId}/sidebar-preferences/me`),
  updateProjectOrder: (productId: string, data: UpsertSidebarOrderPreference) =>
    api.put<SidebarOrderPreference>(`/products/${productId}/sidebar-preferences/me`, data),
};
