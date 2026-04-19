import type { SidebarBadges } from "@softclipai/shared";
import { api } from "./client";

export const sidebarBadgesApi = {
  get: (productId: string) => api.get<SidebarBadges>(`/companies/${productId}/sidebar-badges`),
};
