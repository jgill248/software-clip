import { eq } from "drizzle-orm";
import type { Db } from "@softclipai/db";
import { assets } from "@softclipai/db";

export function assetService(db: Db) {
  return {
    create: (productId: string, data: Omit<typeof assets.$inferInsert, "productId">) =>
      db
        .insert(assets)
        .values({ ...data, productId })
        .returning()
        .then((rows) => rows[0]),

    getById: (id: string) =>
      db
        .select()
        .from(assets)
        .where(eq(assets.id, id))
        .then((rows) => rows[0] ?? null),
  };
}

