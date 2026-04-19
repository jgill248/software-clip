import { pgTable, uuid, text, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";

// Softclip pivot §1 (Stage 4a): core entity table renamed from
// `companies` to `products`. The old `companies` identifier is kept as
// an alias in the schema barrel for backward compatibility — existing
// `eq(companies.id, ...)` queries continue to compile unchanged.
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    pauseReason: text("pause_reason"),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    issuePrefix: text("issue_prefix").notNull().default("PAP"),
    issueCounter: integer("issue_counter").notNull().default(0),
    budgetMonthlyCents: integer("budget_monthly_cents").notNull().default(0),
    spentMonthlyCents: integer("spent_monthly_cents").notNull().default(0),
    // Softclip pivot §6: requireBoardApprovalForNewAgents removed (migration 0061).
    feedbackDataSharingEnabled: boolean("feedback_data_sharing_enabled")
      .notNull()
      .default(false),
    feedbackDataSharingConsentAt: timestamp("feedback_data_sharing_consent_at", { withTimezone: true }),
    feedbackDataSharingConsentByUserId: text("feedback_data_sharing_consent_by_user_id"),
    feedbackDataSharingTermsVersion: text("feedback_data_sharing_terms_version"),
    // Softclip pivot §6: brand_color column removed (migration 0062).
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    issuePrefixUniqueIdx: uniqueIndex("products_issue_prefix_idx").on(table.issuePrefix),
  }),
);

// Back-compat alias — callers using `companies` keep compiling. Remove
// in Stage 4c once all service-layer and UI references migrate to
// `products`.
export const companies = products;
