export const queryKeys = {
  companies: {
    all: ["companies"] as const,
    detail: (id: string) => ["companies", id] as const,
    stats: ["companies", "stats"] as const,
  },
  companySkills: {
    list: (productId: string) => ["company-skills", productId] as const,
    detail: (productId: string, skillId: string) => ["company-skills", productId, skillId] as const,
    updateStatus: (productId: string, skillId: string) =>
      ["company-skills", productId, skillId, "update-status"] as const,
    file: (productId: string, skillId: string, relativePath: string) =>
      ["company-skills", productId, skillId, "file", relativePath] as const,
  },
  agents: {
    list: (productId: string) => ["agents", productId] as const,
    detail: (id: string) => ["agents", "detail", id] as const,
    runtimeState: (id: string) => ["agents", "runtime-state", id] as const,
    taskSessions: (id: string) => ["agents", "task-sessions", id] as const,
    skills: (id: string) => ["agents", "skills", id] as const,
    instructionsBundle: (id: string) => ["agents", "instructions-bundle", id] as const,
    instructionsFile: (id: string, relativePath: string) =>
      ["agents", "instructions-bundle", id, "file", relativePath] as const,
    keys: (agentId: string) => ["agents", "keys", agentId] as const,
    configRevisions: (agentId: string) => ["agents", "config-revisions", agentId] as const,
    adapterModels: (productId: string, adapterType: string) =>
      ["agents", productId, "adapter-models", adapterType] as const,
    detectModel: (productId: string, adapterType: string) =>
      ["agents", productId, "detect-model", adapterType] as const,
  },
  issues: {
    list: (productId: string) => ["issues", productId] as const,
    search: (productId: string, q: string, projectId?: string, limit?: number) =>
      ["issues", productId, "search", q, projectId ?? "__all-projects__", limit ?? "__no-limit__"] as const,
    listAssignedToMe: (productId: string) => ["issues", productId, "assigned-to-me"] as const,
    listMineByMe: (productId: string) => ["issues", productId, "mine-by-me"] as const,
    listTouchedByMe: (productId: string) => ["issues", productId, "touched-by-me"] as const,
    listUnreadTouchedByMe: (productId: string) => ["issues", productId, "unread-touched-by-me"] as const,
    labels: (productId: string) => ["issues", productId, "labels"] as const,
    listByProject: (productId: string, projectId: string) =>
      ["issues", productId, "project", projectId] as const,
    listByParent: (productId: string, parentId: string) =>
      ["issues", productId, "parent", parentId] as const,
    listByExecutionWorkspace: (productId: string, executionWorkspaceId: string) =>
      ["issues", productId, "execution-workspace", executionWorkspaceId] as const,
    detail: (id: string) => ["issues", "detail", id] as const,
    comments: (issueId: string) => ["issues", "comments", issueId] as const,
    feedbackVotes: (issueId: string) => ["issues", "feedback-votes", issueId] as const,
    attachments: (issueId: string) => ["issues", "attachments", issueId] as const,
    documents: (issueId: string) => ["issues", "documents", issueId] as const,
    documentRevisions: (issueId: string, key: string) => ["issues", "document-revisions", issueId, key] as const,
    activity: (issueId: string) => ["issues", "activity", issueId] as const,
    runs: (issueId: string) => ["issues", "runs", issueId] as const,
    approvals: (issueId: string) => ["issues", "approvals", issueId] as const,
    acceptanceCriteria: (issueId: string) =>
      ["issues", "acceptance-criteria", issueId] as const,
    liveRuns: (issueId: string) => ["issues", "live-runs", issueId] as const,
    activeRun: (issueId: string) => ["issues", "active-run", issueId] as const,
    workProducts: (issueId: string) => ["issues", "work-products", issueId] as const,
  },
  routines: {
    list: (productId: string) => ["routines", productId] as const,
    detail: (id: string) => ["routines", "detail", id] as const,
    runs: (id: string) => ["routines", "runs", id] as const,
    activity: (productId: string, id: string) => ["routines", "activity", productId, id] as const,
  },
  sprints: {
    list: (productId: string, state?: string) =>
      ["sprints", productId, state ?? "__all__"] as const,
    active: (productId: string) => ["sprints", productId, "active"] as const,
    detail: (id: string) => ["sprints", "detail", id] as const,
    issues: (id: string) => ["sprints", "issues", id] as const,
    summary: (id: string) => ["sprints", "summary", id] as const,
  },
  executionWorkspaces: {
    list: (productId: string, filters?: Record<string, string | boolean | undefined>) =>
      ["execution-workspaces", productId, filters ?? {}] as const,
    summaryList: (productId: string, filters?: Record<string, string | boolean | undefined>) =>
      ["execution-workspaces", productId, "summary", filters ?? {}] as const,
    detail: (id: string) => ["execution-workspaces", "detail", id] as const,
    closeReadiness: (id: string) => ["execution-workspaces", "close-readiness", id] as const,
    workspaceOperations: (id: string) => ["execution-workspaces", "workspace-operations", id] as const,
  },
  projects: {
    list: (productId: string) => ["projects", productId] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  goals: {
    list: (productId: string) => ["goals", productId] as const,
    detail: (id: string) => ["goals", "detail", id] as const,
  },
  // Softclip pivot §6: queryKeys.budgets branch removed along with the UI
  // budget panels. Nothing should be reading budgets overview data any more.
  approvals: {
    list: (productId: string, status?: string) =>
      ["approvals", productId, status] as const,
    detail: (approvalId: string) => ["approvals", "detail", approvalId] as const,
    comments: (approvalId: string) => ["approvals", "comments", approvalId] as const,
    issues: (approvalId: string) => ["approvals", "issues", approvalId] as const,
  },
  access: {
    invites: (productId: string, state: string = "all", limit: number = 20) =>
      ["access", "invites", "paginated-v1", productId, state, limit] as const,
    joinRequests: (productId: string, status: string = "pending_approval") =>
      ["access", "join-requests", productId, status] as const,
    companyMembers: (productId: string) => ["access", "company-members", productId] as const,
    companyUserDirectory: (productId: string) => ["access", "company-user-directory", productId] as const,
    adminUsers: (query: string) => ["access", "admin-users", query] as const,
    userCompanyAccess: (userId: string) => ["access", "user-company-access", userId] as const,
    invite: (token: string) => ["access", "invite", token] as const,
    currentBoardAccess: ["access", "current-board-access"] as const,
  },
  auth: {
    session: ["auth", "session"] as const,
  },
  sidebarPreferences: {
    companyOrder: (userId: string) => ["sidebar-preferences", "company-order", userId] as const,
    projectOrder: (productId: string, userId: string) =>
      ["sidebar-preferences", "project-order", productId, userId] as const,
  },
  instance: {
    generalSettings: ["instance", "general-settings"] as const,
    schedulerHeartbeats: ["instance", "scheduler-heartbeats"] as const,
    experimentalSettings: ["instance", "experimental-settings"] as const,
  },
  health: ["health"] as const,
  secrets: {
    list: (productId: string) => ["secrets", productId] as const,
    providers: (productId: string) => ["secret-providers", productId] as const,
  },
  dashboard: (productId: string) => ["dashboard", productId] as const,
  sidebarBadges: (productId: string) => ["sidebar-badges", productId] as const,
  inboxDismissals: (productId: string) => ["inbox-dismissals", productId] as const,
  activity: (productId: string) => ["activity", productId] as const,
  costs: (productId: string, from?: string, to?: string) =>
    ["costs", productId, from, to] as const,
  usageByProvider: (productId: string, from?: string, to?: string) =>
    ["usage-by-provider", productId, from, to] as const,
  usageByBiller: (productId: string, from?: string, to?: string) =>
    ["usage-by-biller", productId, from, to] as const,
  // Softclip pivot §6: finance-* query keys removed (finance_events
  // table is gone). Cost-* keys stay because LiveUpdatesProvider still
  // invalidates them on live events — the invalidation is a no-op now
  // but the hook remains.
  usageWindowSpend: (productId: string) =>
    ["usage-window-spend", productId] as const,
  usageQuotaWindows: (productId: string) =>
    ["usage-quota-windows", productId] as const,
  heartbeats: (productId: string, agentId?: string) =>
    ["heartbeats", productId, agentId] as const,
  runDetail: (runId: string) => ["heartbeat-run", runId] as const,
  runWorkspaceOperations: (runId: string) => ["heartbeat-run", runId, "workspace-operations"] as const,
  liveRuns: (productId: string) => ["live-runs", productId] as const,
  runIssues: (runId: string) => ["run-issues", runId] as const,
  org: (productId: string) => ["org", productId] as const,
  skills: {
    available: ["skills", "available"] as const,
  },
  plugins: {
    all: ["plugins"] as const,
    examples: ["plugins", "examples"] as const,
    detail: (pluginId: string) => ["plugins", pluginId] as const,
    health: (pluginId: string) => ["plugins", pluginId, "health"] as const,
    uiContributions: ["plugins", "ui-contributions"] as const,
    config: (pluginId: string) => ["plugins", pluginId, "config"] as const,
    dashboard: (pluginId: string) => ["plugins", pluginId, "dashboard"] as const,
    logs: (pluginId: string) => ["plugins", pluginId, "logs"] as const,
  },
  adapters: {
    all: ["adapters"] as const,
  },
};
