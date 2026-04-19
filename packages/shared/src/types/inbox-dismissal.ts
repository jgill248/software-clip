export interface InboxDismissal {
  id: string;
  productId: string;
  userId: string;
  itemKey: string;
  dismissedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
