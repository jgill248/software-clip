import type { InboxDismissal } from "@softclipai/shared";
import { api } from "./client";

export const inboxDismissalsApi = {
  list: (productId: string) => api.get<InboxDismissal[]>(`/products/${productId}/inbox-dismissals`),
  dismiss: (productId: string, itemKey: string) =>
    api.post<InboxDismissal>(`/products/${productId}/inbox-dismissals`, { itemKey }),
};
