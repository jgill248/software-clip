CREATE TABLE "sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"state" text DEFAULT 'planned' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_by_agent_id" uuid,
	"created_by_user_id" text,
	"updated_by_agent_id" uuid,
	"updated_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_company_id_companies_id_fk"
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_created_by_agent_id_agents_id_fk"
	FOREIGN KEY ("created_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_updated_by_agent_id_agents_id_fk"
	FOREIGN KEY ("updated_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sprints_company_state_idx" ON "sprints" ("company_id", "state");
--> statement-breakpoint
CREATE INDEX "sprints_company_ends_at_idx" ON "sprints" ("company_id", "ends_at");
--> statement-breakpoint
-- Enforce at-most-one active sprint per company. Planned and closed are
-- unrestricted; the partial predicate excludes them from the uniqueness
-- check.
CREATE UNIQUE INDEX "sprints_company_active_uq"
	ON "sprints" ("company_id")
	WHERE "state" = 'active';
--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "sprint_id" uuid;
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_sprint_id_sprints_id_fk"
	FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "issues_company_sprint_idx" ON "issues" ("company_id", "sprint_id");
