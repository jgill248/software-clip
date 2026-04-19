import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./products.js";

export const inboxDismissals = pgTable(
  "inbox_dismissals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id),
    userId: text("user_id").notNull(),
    itemKey: text("item_key").notNull(),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyUserIdx: index("inbox_dismissals_product_user_idx").on(table.productId, table.userId),
    companyItemIdx: index("inbox_dismissals_product_item_idx").on(table.productId, table.itemKey),
    companyUserItemUnique: uniqueIndex("inbox_dismissals_product_user_item_idx").on(
      table.productId,
      table.userId,
      table.itemKey,
    ),
  }),
);
