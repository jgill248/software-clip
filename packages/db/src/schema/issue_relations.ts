import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { agents } from "./agents.js";
import { products } from "./products.js";
import { issues } from "./issues.js";

export const issueRelations = pgTable(
  "issue_relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    relatedIssueId: uuid("related_issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    type: text("type").$type<"blocks">().notNull(),
    createdByAgentId: uuid("created_by_agent_id").references(() => agents.id, { onDelete: "set null" }),
    createdByUserId: text("created_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIssueIdx: index("issue_relations_product_issue_idx").on(table.productId, table.issueId),
    companyRelatedIssueIdx: index("issue_relations_product_related_issue_idx").on(table.productId, table.relatedIssueId),
    companyTypeIdx: index("issue_relations_product_type_idx").on(table.productId, table.type),
    companyEdgeUq: uniqueIndex("issue_relations_product_edge_uq").on(
      table.productId,
      table.issueId,
      table.relatedIssueId,
      table.type,
    ),
  }),
);
