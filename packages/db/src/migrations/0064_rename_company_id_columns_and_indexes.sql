-- Softclip pivot §1 (Stage 4b): rename company_id columns and
-- related indexes on the 49 child tables that reference the
-- renamed products table (§1 Stage 4a).
--
-- Companion to Drizzle schema updates: `uuid("company_id")` →
-- `uuid("product_id")` and index name strings `*_company_*_idx`
-- → `*_product_*_idx` in every child schema file.
--
-- TS field names (`companyId`) are unchanged — Drizzle keeps
-- mapping `companyId` to the renamed SQL column via the second
-- argument of uuid(). That TS rename is Stage 4c.
--
-- cli_auth_challenges.requested_company_id and related index are
-- left alone (different column name, different rename).

ALTER TABLE "activity_log" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "agent_api_keys" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "agent_config_revisions" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "agent_runtime_state" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "agent_task_sessions" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "agent_wakeup_requests" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "agents" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "approval_comments" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "approvals" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "assets" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "company_memberships" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "company_secrets" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "company_skills" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "company_user_sidebar_preferences" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "cost_events" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "document_revisions" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "execution_workspaces" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "feedback_exports" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "feedback_votes" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "goals" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "heartbeat_run_events" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "heartbeat_runs" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "inbox_dismissals" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "invites" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_approvals" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_attachments" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_comments" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_documents" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_execution_decisions" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_inbox_archives" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_labels" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_read_states" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_relations" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issue_work_products" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "issues" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "join_requests" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "labels" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "plugin_company_settings" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "principal_permission_grants" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "project_goals" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "project_workspaces" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "routines" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "routine_triggers" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "routine_runs" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "sprints" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "workspace_operations" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint
ALTER TABLE "workspace_runtime_services" RENAME COLUMN "company_id" TO "product_id";
--> statement-breakpoint

ALTER INDEX "activity_log_company_created_idx" RENAME TO "activity_log_product_created_idx";
--> statement-breakpoint
ALTER INDEX "agent_api_keys_company_agent_idx" RENAME TO "agent_api_keys_product_agent_idx";
--> statement-breakpoint
ALTER INDEX "agent_config_revisions_company_agent_created_idx" RENAME TO "agent_config_revisions_product_agent_created_idx";
--> statement-breakpoint
ALTER INDEX "agent_runtime_state_company_agent_idx" RENAME TO "agent_runtime_state_product_agent_idx";
--> statement-breakpoint
ALTER INDEX "agent_runtime_state_company_updated_idx" RENAME TO "agent_runtime_state_product_updated_idx";
--> statement-breakpoint
ALTER INDEX "agent_task_sessions_company_agent_updated_idx" RENAME TO "agent_task_sessions_product_agent_updated_idx";
--> statement-breakpoint
ALTER INDEX "agent_task_sessions_company_task_updated_idx" RENAME TO "agent_task_sessions_product_task_updated_idx";
--> statement-breakpoint
ALTER INDEX "agent_wakeup_requests_company_agent_status_idx" RENAME TO "agent_wakeup_requests_product_agent_status_idx";
--> statement-breakpoint
ALTER INDEX "agent_wakeup_requests_company_requested_idx" RENAME TO "agent_wakeup_requests_product_requested_idx";
--> statement-breakpoint
ALTER INDEX "agents_company_reports_to_idx" RENAME TO "agents_product_reports_to_idx";
--> statement-breakpoint
ALTER INDEX "agents_company_status_idx" RENAME TO "agents_product_status_idx";
--> statement-breakpoint
ALTER INDEX "approval_comments_company_idx" RENAME TO "approval_comments_product_idx";
--> statement-breakpoint
ALTER INDEX "approvals_company_status_type_idx" RENAME TO "approvals_product_status_type_idx";
--> statement-breakpoint
ALTER INDEX "assets_company_created_idx" RENAME TO "assets_product_created_idx";
--> statement-breakpoint
ALTER INDEX "assets_company_provider_idx" RENAME TO "assets_product_provider_idx";
--> statement-breakpoint
ALTER INDEX "company_memberships_company_principal_unique_idx" RENAME TO "company_memberships_product_principal_unique_idx";
--> statement-breakpoint
ALTER INDEX "company_memberships_company_status_idx" RENAME TO "company_memberships_product_status_idx";
--> statement-breakpoint
ALTER INDEX "company_secrets_company_idx" RENAME TO "company_secrets_product_idx";
--> statement-breakpoint
ALTER INDEX "company_secrets_company_provider_idx" RENAME TO "company_secrets_product_provider_idx";
--> statement-breakpoint
ALTER INDEX "company_skills_company_key_idx" RENAME TO "company_skills_product_key_idx";
--> statement-breakpoint
ALTER INDEX "company_skills_company_name_idx" RENAME TO "company_skills_product_name_idx";
--> statement-breakpoint
ALTER INDEX "company_user_sidebar_preferences_company_idx" RENAME TO "company_user_sidebar_preferences_product_idx";
--> statement-breakpoint
ALTER INDEX "cost_events_company_agent_occurred_idx" RENAME TO "cost_events_product_agent_occurred_idx";
--> statement-breakpoint
ALTER INDEX "cost_events_company_biller_occurred_idx" RENAME TO "cost_events_product_biller_occurred_idx";
--> statement-breakpoint
ALTER INDEX "cost_events_company_heartbeat_run_idx" RENAME TO "cost_events_product_heartbeat_run_idx";
--> statement-breakpoint
ALTER INDEX "cost_events_company_occurred_idx" RENAME TO "cost_events_product_occurred_idx";
--> statement-breakpoint
ALTER INDEX "cost_events_company_provider_occurred_idx" RENAME TO "cost_events_product_provider_occurred_idx";
--> statement-breakpoint
ALTER INDEX "document_revisions_company_document_created_idx" RENAME TO "document_revisions_product_document_created_idx";
--> statement-breakpoint
ALTER INDEX "documents_company_created_idx" RENAME TO "documents_product_created_idx";
--> statement-breakpoint
ALTER INDEX "documents_company_updated_idx" RENAME TO "documents_product_updated_idx";
--> statement-breakpoint
ALTER INDEX "execution_workspaces_company_branch_idx" RENAME TO "execution_workspaces_product_branch_idx";
--> statement-breakpoint
ALTER INDEX "execution_workspaces_company_last_used_idx" RENAME TO "execution_workspaces_product_last_used_idx";
--> statement-breakpoint
ALTER INDEX "execution_workspaces_company_project_status_idx" RENAME TO "execution_workspaces_product_project_status_idx";
--> statement-breakpoint
ALTER INDEX "execution_workspaces_company_project_workspace_status_idx" RENAME TO "execution_workspaces_product_project_workspace_status_idx";
--> statement-breakpoint
ALTER INDEX "execution_workspaces_company_source_issue_idx" RENAME TO "execution_workspaces_product_source_issue_idx";
--> statement-breakpoint
ALTER INDEX "feedback_exports_company_author_idx" RENAME TO "feedback_exports_product_author_idx";
--> statement-breakpoint
ALTER INDEX "feedback_exports_company_created_idx" RENAME TO "feedback_exports_product_created_idx";
--> statement-breakpoint
ALTER INDEX "feedback_exports_company_issue_idx" RENAME TO "feedback_exports_product_issue_idx";
--> statement-breakpoint
ALTER INDEX "feedback_exports_company_project_idx" RENAME TO "feedback_exports_product_project_idx";
--> statement-breakpoint
ALTER INDEX "feedback_exports_company_status_idx" RENAME TO "feedback_exports_product_status_idx";
--> statement-breakpoint
ALTER INDEX "feedback_votes_company_issue_idx" RENAME TO "feedback_votes_product_issue_idx";
--> statement-breakpoint
ALTER INDEX "feedback_votes_company_target_author_idx" RENAME TO "feedback_votes_product_target_author_idx";
--> statement-breakpoint
ALTER INDEX "goals_company_idx" RENAME TO "goals_product_idx";
--> statement-breakpoint
ALTER INDEX "heartbeat_run_events_company_created_idx" RENAME TO "heartbeat_run_events_product_created_idx";
--> statement-breakpoint
ALTER INDEX "heartbeat_run_events_company_run_idx" RENAME TO "heartbeat_run_events_product_run_idx";
--> statement-breakpoint
ALTER INDEX "heartbeat_runs_company_agent_started_idx" RENAME TO "heartbeat_runs_product_agent_started_idx";
--> statement-breakpoint
ALTER INDEX "inbox_dismissals_company_item_idx" RENAME TO "inbox_dismissals_product_item_idx";
--> statement-breakpoint
ALTER INDEX "inbox_dismissals_company_user_idx" RENAME TO "inbox_dismissals_product_user_idx";
--> statement-breakpoint
ALTER INDEX "inbox_dismissals_company_user_item_idx" RENAME TO "inbox_dismissals_product_user_item_idx";
--> statement-breakpoint
ALTER INDEX "invites_company_invite_state_idx" RENAME TO "invites_product_invite_state_idx";
--> statement-breakpoint
ALTER INDEX "issue_approvals_company_idx" RENAME TO "issue_approvals_product_idx";
--> statement-breakpoint
ALTER INDEX "issue_attachments_company_issue_idx" RENAME TO "issue_attachments_product_issue_idx";
--> statement-breakpoint
ALTER INDEX "issue_comments_company_author_issue_created_at_idx" RENAME TO "issue_comments_product_author_issue_created_at_idx";
--> statement-breakpoint
ALTER INDEX "issue_comments_company_idx" RENAME TO "issue_comments_product_idx";
--> statement-breakpoint
ALTER INDEX "issue_comments_company_issue_created_at_idx" RENAME TO "issue_comments_product_issue_created_at_idx";
--> statement-breakpoint
ALTER INDEX "issue_documents_company_issue_updated_idx" RENAME TO "issue_documents_product_issue_updated_idx";
--> statement-breakpoint
ALTER INDEX "issue_execution_decisions_company_issue_idx" RENAME TO "issue_execution_decisions_product_issue_idx";
--> statement-breakpoint
ALTER INDEX "issue_inbox_archives_company_issue_idx" RENAME TO "issue_inbox_archives_product_issue_idx";
--> statement-breakpoint
ALTER INDEX "issue_inbox_archives_company_issue_user_idx" RENAME TO "issue_inbox_archives_product_issue_user_idx";
--> statement-breakpoint
ALTER INDEX "issue_inbox_archives_company_user_idx" RENAME TO "issue_inbox_archives_product_user_idx";
--> statement-breakpoint
ALTER INDEX "issue_labels_company_idx" RENAME TO "issue_labels_product_idx";
--> statement-breakpoint
ALTER INDEX "issue_read_states_company_issue_idx" RENAME TO "issue_read_states_product_issue_idx";
--> statement-breakpoint
ALTER INDEX "issue_read_states_company_issue_user_idx" RENAME TO "issue_read_states_product_issue_user_idx";
--> statement-breakpoint
ALTER INDEX "issue_read_states_company_user_idx" RENAME TO "issue_read_states_product_user_idx";
--> statement-breakpoint
ALTER INDEX "issue_relations_company_issue_idx" RENAME TO "issue_relations_product_issue_idx";
--> statement-breakpoint
ALTER INDEX "issue_relations_company_related_issue_idx" RENAME TO "issue_relations_product_related_issue_idx";
--> statement-breakpoint
ALTER INDEX "issue_relations_company_type_idx" RENAME TO "issue_relations_product_type_idx";
--> statement-breakpoint
ALTER INDEX "issue_work_products_company_execution_workspace_type_idx" RENAME TO "issue_work_products_product_execution_workspace_type_idx";
--> statement-breakpoint
ALTER INDEX "issue_work_products_company_issue_type_idx" RENAME TO "issue_work_products_product_issue_type_idx";
--> statement-breakpoint
ALTER INDEX "issue_work_products_company_provider_external_id_idx" RENAME TO "issue_work_products_product_provider_external_id_idx";
--> statement-breakpoint
ALTER INDEX "issue_work_products_company_updated_idx" RENAME TO "issue_work_products_product_updated_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_assignee_status_idx" RENAME TO "issues_product_assignee_status_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_assignee_user_status_idx" RENAME TO "issues_product_assignee_user_status_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_execution_workspace_idx" RENAME TO "issues_product_execution_workspace_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_origin_idx" RENAME TO "issues_product_origin_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_parent_idx" RENAME TO "issues_product_parent_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_project_idx" RENAME TO "issues_product_project_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_project_workspace_idx" RENAME TO "issues_product_project_workspace_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_sprint_idx" RENAME TO "issues_product_sprint_idx";
--> statement-breakpoint
ALTER INDEX "issues_company_status_idx" RENAME TO "issues_product_status_idx";
--> statement-breakpoint
ALTER INDEX "join_requests_company_status_type_created_idx" RENAME TO "join_requests_product_status_type_created_idx";
--> statement-breakpoint
ALTER INDEX "labels_company_idx" RENAME TO "labels_product_idx";
--> statement-breakpoint
ALTER INDEX "labels_company_name_idx" RENAME TO "labels_product_name_idx";
--> statement-breakpoint
ALTER INDEX "plugin_company_settings_company_idx" RENAME TO "plugin_company_settings_product_idx";
--> statement-breakpoint
ALTER INDEX "principal_permission_grants_company_permission_idx" RENAME TO "principal_permission_grants_product_permission_idx";
--> statement-breakpoint
ALTER INDEX "project_goals_company_idx" RENAME TO "project_goals_product_idx";
--> statement-breakpoint
ALTER INDEX "project_workspaces_company_project_idx" RENAME TO "project_workspaces_product_project_idx";
--> statement-breakpoint
ALTER INDEX "project_workspaces_company_shared_key_idx" RENAME TO "project_workspaces_product_shared_key_idx";
--> statement-breakpoint
ALTER INDEX "projects_company_idx" RENAME TO "projects_product_idx";
--> statement-breakpoint
ALTER INDEX "routine_runs_company_routine_idx" RENAME TO "routine_runs_product_routine_idx";
--> statement-breakpoint
ALTER INDEX "routine_triggers_company_kind_idx" RENAME TO "routine_triggers_product_kind_idx";
--> statement-breakpoint
ALTER INDEX "routine_triggers_company_routine_idx" RENAME TO "routine_triggers_product_routine_idx";
--> statement-breakpoint
ALTER INDEX "routines_company_assignee_idx" RENAME TO "routines_product_assignee_idx";
--> statement-breakpoint
ALTER INDEX "routines_company_project_idx" RENAME TO "routines_product_project_idx";
--> statement-breakpoint
ALTER INDEX "routines_company_status_idx" RENAME TO "routines_product_status_idx";
--> statement-breakpoint
ALTER INDEX "sprints_company_ends_at_idx" RENAME TO "sprints_product_ends_at_idx";
--> statement-breakpoint
ALTER INDEX "sprints_company_state_idx" RENAME TO "sprints_product_state_idx";
--> statement-breakpoint
ALTER INDEX "workspace_operations_company_run_started_idx" RENAME TO "workspace_operations_product_run_started_idx";
--> statement-breakpoint
ALTER INDEX "workspace_operations_company_workspace_started_idx" RENAME TO "workspace_operations_product_workspace_started_idx";
--> statement-breakpoint
ALTER INDEX "workspace_runtime_services_company_execution_workspace_status_idx" RENAME TO "workspace_runtime_services_product_execution_workspace_status_idx";
--> statement-breakpoint
ALTER INDEX "workspace_runtime_services_company_project_status_idx" RENAME TO "workspace_runtime_services_product_project_status_idx";
--> statement-breakpoint
ALTER INDEX "workspace_runtime_services_company_updated_idx" RENAME TO "workspace_runtime_services_product_updated_idx";
--> statement-breakpoint
ALTER INDEX "workspace_runtime_services_company_workspace_status_idx" RENAME TO "workspace_runtime_services_product_workspace_status_idx";
--> statement-breakpoint
