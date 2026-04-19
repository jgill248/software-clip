export { healthRoutes } from "./health.js";
export { productRoutes } from "./products.js";
export { companySkillRoutes } from "./company-skills.js";
export { agentRoutes } from "./agents.js";
export { projectRoutes } from "./projects.js";
export { issueRoutes } from "./issues.js";
export { issueAcceptanceCriteriaRoutes } from "./issue-acceptance-criteria.js";
export { sprintRoutes } from "./sprints.js";
export { issueReviewRoutes } from "./issue-reviews.js";
export { issuePlanRoutes } from "./issue-plans.js";
export { ceremonyRoutes } from "./ceremonies.js";
export { routineRoutes } from "./routines.js";
export { goalRoutes } from "./goals.js";
export { approvalRoutes } from "./approvals.js";
export { secretRoutes } from "./secrets.js";
// Softclip pivot §6: costRoutes removed along with the dollar-budget
// governance layer. cost_events are still recorded via
// services/costs.ts but no longer exposed over HTTP.
export { activityRoutes } from "./activity.js";
export { dashboardRoutes } from "./dashboard.js";
export { sidebarBadgeRoutes } from "./sidebar-badges.js";
export { sidebarPreferenceRoutes } from "./sidebar-preferences.js";
export { inboxDismissalRoutes } from "./inbox-dismissals.js";
export { llmRoutes } from "./llms.js";
export { accessRoutes } from "./access.js";
export { instanceSettingsRoutes } from "./instance-settings.js";
