import { pgTable, uuid, text, timestamp, date, index, jsonb } from "drizzle-orm/pg-core";
import type { AgentEnvConfig } from "@softclipai/shared";
import { products } from "./products.js";
import { goals } from "./goals.js";
import { agents } from "./agents.js";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id),
    goalId: uuid("goal_id").references(() => goals.id),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().default("backlog"),
    leadAgentId: uuid("lead_agent_id").references(() => agents.id),
    targetDate: date("target_date"),
    color: text("color"),
    env: jsonb("env").$type<AgentEnvConfig>(),
    pauseReason: text("pause_reason"),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    executionWorkspacePolicy: jsonb("execution_workspace_policy").$type<Record<string, unknown>>(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("projects_product_idx").on(table.productId),
  }),
);
