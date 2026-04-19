import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@softclipai/db";
import { inboxDismissals } from "@softclipai/db";

export function inboxDismissalService(db: Db) {
  return {
    list: async (productId: string, userId: string) =>
      db
        .select()
        .from(inboxDismissals)
        .where(and(eq(inboxDismissals.productId, productId), eq(inboxDismissals.userId, userId)))
        .orderBy(desc(inboxDismissals.updatedAt)),

    dismiss: async (
      productId: string,
      userId: string,
      itemKey: string,
      dismissedAt: Date = new Date(),
    ) => {
      const now = new Date();
      const [row] = await db
        .insert(inboxDismissals)
        .values({
          productId,
          userId,
          itemKey,
          dismissedAt,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [inboxDismissals.productId, inboxDismissals.userId, inboxDismissals.itemKey],
          set: {
            dismissedAt,
            updatedAt: now,
          },
        })
        .returning();
      return row;
    },
  };
}
