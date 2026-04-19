-- Softclip pivot §1 (Stage 4a): rename the core entity table from
-- `companies` to `products`.
--
-- Every entity in the control plane is actually a software product
-- the dev team ships — not a company. "Company" is legacy from the
-- pre-pivot AI-company control plane. This migration renames the
-- SQL table only; `company_id` columns in child tables and their
-- indexes keep their existing names for now (follow-up migration).
-- Foreign keys in child tables continue to reference the renamed
-- table automatically — Postgres preserves the FK across table
-- renames.
--
-- TypeScript callers that still refer to the binding as `companies`
-- keep compiling because the Drizzle schema barrel publishes both
-- `products` (primary) and `companies` (alias) pointing at the same
-- table definition.

ALTER TABLE "companies" RENAME TO "products";
--> statement-breakpoint
ALTER INDEX "companies_issue_prefix_idx" RENAME TO "products_issue_prefix_idx";
