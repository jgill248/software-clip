CREATE TABLE "issue_acceptance_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"text" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"waived_reason" text,
	"created_by_agent_id" uuid,
	"created_by_user_id" text,
	"updated_by_agent_id" uuid,
	"updated_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue_acceptance_criteria" ADD CONSTRAINT "issue_acceptance_criteria_issue_id_issues_id_fk"
	FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "issue_acceptance_criteria" ADD CONSTRAINT "issue_acceptance_criteria_created_by_agent_id_agents_id_fk"
	FOREIGN KEY ("created_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "issue_acceptance_criteria" ADD CONSTRAINT "issue_acceptance_criteria_updated_by_agent_id_agents_id_fk"
	FOREIGN KEY ("updated_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "issue_acceptance_criteria_issue_status_idx"
	ON "issue_acceptance_criteria" ("issue_id", "status");
--> statement-breakpoint
CREATE INDEX "issue_acceptance_criteria_issue_order_idx"
	ON "issue_acceptance_criteria" ("issue_id", "order_index");
--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "issue_type" text DEFAULT 'feature' NOT NULL;
--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "definition_of_done_met" boolean DEFAULT false NOT NULL;
