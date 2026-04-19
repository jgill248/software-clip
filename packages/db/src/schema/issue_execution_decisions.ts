import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "./products.js";
import { issues } from "./issues.js";
import { agents } from "./agents.js";
import { heartbeatRuns } from "./heartbeat_runs.js";

export const issueExecutionDecisions = pgTable(
  "issue_execution_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    stageId: uuid("stage_id").notNull(),
    stageType: text("stage_type").notNull(),
    actorAgentId: uuid("actor_agent_id").references(() => agents.id),
    actorUserId: text("actor_user_id"),
    outcome: text("outcome").notNull(),
    body: text("body").notNull(),
    createdByRunId: uuid("created_by_run_id").references(() => heartbeatRuns.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIssueIdx: index("issue_execution_decisions_product_issue_idx").on(table.productId, table.issueId),
    stageIdx: index("issue_execution_decisions_stage_idx").on(table.issueId, table.stageId, table.createdAt),
  }),
);
