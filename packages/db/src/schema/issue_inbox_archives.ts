import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./products.js";
import { issues } from "./issues.js";

export const issueInboxArchives = pgTable(
  "issue_inbox_archives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id),
    issueId: uuid("issue_id").notNull().references(() => issues.id),
    userId: text("user_id").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIssueIdx: index("issue_inbox_archives_product_issue_idx").on(table.productId, table.issueId),
    companyUserIdx: index("issue_inbox_archives_product_user_idx").on(table.productId, table.userId),
    companyIssueUserUnique: uniqueIndex("issue_inbox_archives_product_issue_user_idx").on(
      table.productId,
      table.issueId,
      table.userId,
    ),
  }),
);
