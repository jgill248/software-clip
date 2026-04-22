import type { SidebarBadges } from "@softclipai/shared";
import { api } from "./client";

export const sidebarBadgesApi = {
  get: (productId: string) => api.get<SidebarBadges>(`/products/${productId}/sidebar-badges`),
};
