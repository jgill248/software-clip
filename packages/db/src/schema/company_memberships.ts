import { pgTable, uuid, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { products } from "./products.js";

export const companyMemberships = pgTable(
  "company_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id),
    principalType: text("principal_type").notNull(),
    principalId: text("principal_id").notNull(),
    status: text("status").notNull().default("active"),
    membershipRole: text("membership_role"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyPrincipalUniqueIdx: uniqueIndex("company_memberships_product_principal_unique_idx").on(
      table.productId,
      table.principalType,
      table.principalId,
    ),
    principalStatusIdx: index("company_memberships_principal_status_idx").on(
      table.principalType,
      table.principalId,
      table.status,
    ),
    companyStatusIdx: index("company_memberships_product_status_idx").on(table.productId, table.status),
  }),
);
