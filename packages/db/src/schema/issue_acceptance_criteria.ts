import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { agents } from "./agents.js";
import { issues } from "./issues.js";

/**
 * Acceptance criteria attached to an issue. Each row is one testable
 * statement; closing an issue requires every row to be `met` or `waived`
 * (the close-guard lives in the issues service).
 */
export const issueAcceptanceCriteria = pgTable(
  "issue_acceptance_criteria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    status: text("status").notNull().default("pending"),
    orderIndex: integer("order_index").notNull().default(0),
    waivedReason: text("waived_reason"),
    createdByAgentId: uuid("created_by_agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("created_by_user_id"),
    updatedByAgentId: uuid("updated_by_agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    updatedByUserId: text("updated_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    issueStatusIdx: index("issue_acceptance_criteria_issue_status_idx").on(
      table.issueId,
      table.status,
    ),
    issueOrderIdx: index("issue_acceptance_criteria_issue_order_idx").on(
      table.issueId,
      table.orderIndex,
    ),
  }),
);

export type AcceptanceCriterionStatus = "pending" | "met" | "waived";
