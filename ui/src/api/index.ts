export { api } from "./client";
export { authApi } from "./auth";
export { healthApi } from "./health";
export { accessApi } from "./access";
export { companiesApi } from "./companies";
export { agentsApi } from "./agents";
export { projectsApi } from "./projects";
export { issuesApi } from "./issues";
export { routinesApi } from "./routines";
export { goalsApi } from "./goals";
export { approvalsApi } from "./approvals";
export { acceptanceCriteriaApi } from "./acceptance-criteria";
export type {
  AcceptanceCriterion,
  AcceptanceCriterionStatus,
  AcceptanceCriteriaSummary,
  AcceptanceCriteriaList,
} from "./acceptance-criteria";
export { sprintsApi } from "./sprints";
export type {
  Sprint,
  SprintState,
  SprintIssueSummary,
  CreateSprintInput,
  UpdateSprintInput,
} from "./sprints";
// Softclip pivot §6: costsApi removed. cost_events are still recorded
// server-side but no UI surfaces them any more.
export { activityApi } from "./activity";
export { dashboardApi } from "./dashboard";
export { heartbeatsApi } from "./heartbeats";
export { instanceSettingsApi } from "./instanceSettings";
export { sidebarBadgesApi } from "./sidebarBadges";
export { sidebarPreferencesApi } from "./sidebarPreferences";
export { inboxDismissalsApi } from "./inboxDismissals";
export { companySkillsApi } from "./companySkills";
