-- Softclip pivot §6: drop dollar-budget governance tables.
--
-- The previous chunks disabled every consumer of these tables. This
-- migration removes them entirely. cost_events is preserved — it's
-- telemetry, not governance.
--
-- Dropping in dependency order: budget_incidents links back to
-- budget_policies via scope ids; drop it first.

DROP TABLE IF EXISTS "budget_incidents";
--> statement-breakpoint
DROP TABLE IF EXISTS "budget_policies";
--> statement-breakpoint
DROP TABLE IF EXISTS "finance_events";
