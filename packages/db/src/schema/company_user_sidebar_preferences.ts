import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { products } from "./products.js";

export const companyUserSidebarPreferences = pgTable(
  "company_user_sidebar_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    projectOrder: jsonb("project_order").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("company_user_sidebar_preferences_product_idx").on(table.companyId),
    userIdx: index("company_user_sidebar_preferences_user_idx").on(table.userId),
    companyUserUq: uniqueIndex("company_user_sidebar_preferences_product_user_uq").on(
      table.companyId,
      table.userId,
    ),
  }),
);
