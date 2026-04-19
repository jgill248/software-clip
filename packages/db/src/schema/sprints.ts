import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { agents } from "./agents.js";
import { products } from "./products.js";

/**
 * A sprint is a time-bound iteration scoped to a product (company). Issues
 * carry a nullable `sprintId` FK to indicate which sprint, if any, they
 * belong to.
 *
 * Lifecycle: `planned` → `active` → `closed`. Transitions are enforced in
 * the service layer; a partial unique index below enforces the invariant
 * that a product has at most one `active` sprint at a time.
 */
export const sprints = pgTable(
  "sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goal: text("goal"),
    state: text("state").notNull().default("planned"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
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
    companyStateIdx: index("sprints_product_state_idx").on(
      table.productId,
      table.state,
    ),
    companyEndsAtIdx: index("sprints_product_ends_at_idx").on(
      table.productId,
      table.endsAt,
    ),
    companyActiveUq: uniqueIndex("sprints_product_active_uq")
      .on(table.productId)
      .where(sql`${table.state} = 'active'`),
  }),
);

export type SprintState = "planned" | "active" | "closed";
