import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  Calendar,
  ChevronRight,
  Columns3,
  Eye,
  GitPullRequest,
  LayoutDashboard,
  PenTool,
  Plus,
  Radio,
  Sparkles,
} from "lucide-react";
import { dashboardApi } from "../api/dashboard";
import { activityApi } from "../api/activity";
import { accessApi } from "../api/access";
import { issuesApi } from "../api/issues";
import { agentsApi } from "../api/agents";
import { projectsApi } from "../api/projects";
import { heartbeatsApi } from "../api/heartbeats";
import { sprintsApi } from "../api/sprints";
import { reviewsApi } from "../api/reviews";
import { buildCompanyUserProfileMap } from "../lib/company-members";
import { useCompany } from "../context/CompanyContext";
import { useDialog } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { ActivityRow } from "../components/ActivityRow";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import { PageSkeleton } from "../components/PageSkeleton";
import type { Agent, Approval, Issue } from "@softclipai/shared";
import { PluginSlotOutlet } from "@/plugins/slots";
import { Card, CardHeader, CardBody } from "@/components/softclip/Card";
import { Chip } from "@/components/softclip/Chip";
import { Kbd } from "@/components/softclip/Kbd";
import { HealthBar } from "@/components/softclip/HealthBar";
import { Burndown } from "@/components/softclip/Burndown";
import { ListRow } from "@/components/softclip/ListRow";
import { IssueRow } from "@/components/softclip/IssueRow";
import { AgentAvatar } from "@/components/softclip/AgentAvatar";
import { StatusDot } from "@/components/softclip/StatusDot";
import { chipVariantForReviewKind } from "@/lib/softclip-design";

const DASHBOARD_HEARTBEAT_RUN_LIMIT = 100;

function reviewKindFromApprovalType(type: Approval["type"]): {
  label: string;
  icon: typeof GitPullRequest;
} {
  switch (type) {
    case "approve_pr":
      return { label: "code", icon: GitPullRequest };
    case "approve_architecture":
      return { label: "architecture", icon: Columns3 };
    case "approve_design":
      return { label: "design", icon: PenTool };
    case "approve_plan":
      return { label: "plan", icon: Columns3 };
    default:
      return { label: type.replace(/^approve_/, "").replace(/_/g, " "), icon: Sparkles };
  }
}

function approvalTitle(approval: Approval): string {
  const payload = approval.payload ?? {};
  const maybe =
    (payload as { title?: string }).title ??
    (payload as { summary?: string }).summary ??
    (payload as { description?: string }).description ??
    null;
  if (typeof maybe === "string" && maybe.trim()) return maybe.trim();
  const { label } = reviewKindFromApprovalType(approval.type);
  return `Pending ${label} review`;
}

function approvalIssueId(approval: Approval): string | null {
  const payload = approval.payload ?? {};
  const raw =
    (payload as { issueId?: string }).issueId ??
    (payload as { issue_id?: string }).issue_id ??
    null;
  return typeof raw === "string" ? raw : null;
}

function getRecentIssues(issues: Issue[]): Issue[] {
  return [...issues].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function Dashboard() {
  const { selectedCompanyId, companies } = useCompany();
  const { openOnboarding, openNewIssue } = useDialog();
  const { setBreadcrumbs, setRightActions } = useBreadcrumbs();
  const navigate = useNavigate();

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    setRightActions(
      <>
        <button
          type="button"
          onClick={() => openNewIssue()}
          className="sc-btn size-sm variant-outline"
        >
          <Plus size={12} />
          New issue
          <Kbd>C</Kbd>
        </button>
      </>,
    );
    return () => setRightActions(null);
  }, [setRightActions, openNewIssue]);

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.dashboard(selectedCompanyId!),
    queryFn: () => dashboardApi.summary(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.activity(selectedCompanyId!),
    queryFn: () => activityApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: issues } = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: runs } = useQuery({
    queryKey: [...queryKeys.heartbeats(selectedCompanyId!), "limit", DASHBOARD_HEARTBEAT_RUN_LIMIT],
    queryFn: () => heartbeatsApi.list(selectedCompanyId!, undefined, DASHBOARD_HEARTBEAT_RUN_LIMIT),
    enabled: !!selectedCompanyId,
  });

  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: activeSprint } = useQuery({
    queryKey: queryKeys.sprints.active(selectedCompanyId!),
    queryFn: () => sprintsApi.getActive(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    retry: false,
  });

  const { data: sprintSummary } = useQuery({
    queryKey: queryKeys.sprints.summary(activeSprint?.id ?? ""),
    queryFn: () => sprintsApi.summary(activeSprint!.id),
    enabled: !!activeSprint?.id,
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: queryKeys.approvals.list(selectedCompanyId!, "pending"),
    queryFn: () => reviewsApi.list(selectedCompanyId!, "pending"),
    enabled: !!selectedCompanyId,
  });

  const userProfileMap = useMemo(
    () => buildCompanyUserProfileMap(companyMembers?.users),
    [companyMembers?.users],
  );

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents ?? []) map.set(a.id, a);
    return map;
  }, [agents]);

  const issueMap = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const i of issues ?? []) map.set(i.id, i);
    return map;
  }, [issues]);

  const entityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues ?? []) map.set(`issue:${i.id}`, i.identifier ?? i.id.slice(0, 8));
    for (const a of agents ?? []) map.set(`agent:${a.id}`, a.name);
    for (const p of projects ?? []) map.set(`project:${p.id}`, p.name);
    return map;
  }, [issues, agents, projects]);

  const entityTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues ?? []) map.set(`issue:${i.id}`, i.title);
    return map;
  }, [issues]);

  const blockedIssues = useMemo(
    () => (issues ?? []).filter((issue) => issue.status === "blocked").slice(0, 5),
    [issues],
  );

  const runningAgents = useMemo(
    () => (agents ?? []).filter((a) => a.status === "running"),
    [agents],
  );

  const recentActivity = useMemo(() => (activity ?? []).slice(0, 8), [activity]);

  const ciFailures = useMemo(
    () =>
      (runs ?? [])
        .filter((run) => (run as { status?: string }).status === "failed" || (run as { status?: string }).status === "errored")
        .slice(0, 5),
    [runs],
  );

  const recentIssues = useMemo(
    () => (issues ? getRecentIssues(issues) : []).slice(0, 6),
    [issues],
  );

  const sprintDays = useMemo(() => {
    if (!activeSprint?.startsAt || !activeSprint?.endsAt) return null;
    const start = new Date(activeSprint.startsAt).getTime();
    const end = new Date(activeSprint.endsAt).getTime();
    const now = Date.now();
    const totalDays = Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)), 1);
    const daysRemaining = Math.max(
      Math.round((end - now) / (1000 * 60 * 60 * 24)),
      0,
    );
    return { totalDays, daysRemaining };
  }, [activeSprint]);

  if (!selectedCompanyId) {
    if (companies.length === 0) {
      return (
        <EmptyState
          icon={LayoutDashboard}
          message="Welcome to Softclip. Set up your first product and Product Owner to get started."
          action="Get Started"
          onAction={openOnboarding}
        />
      );
    }
    return (
      <EmptyState icon={LayoutDashboard} message="Create or select a product to view the dashboard." />
    );
  }

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const hasNoAgents = agents !== undefined && agents.length === 0;

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        maxWidth: 1400,
      }}
    >
      {error && (
        <div
          className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-[5px] t-meta"
          style={{
            background: "var(--accent-red-wash)",
            color: "var(--accent-red)",
            border: "1px solid color-mix(in oklch, var(--accent-red) 40%, transparent)",
          }}
        >
          <AlertTriangle size={12} />
          {error.message}
        </div>
      )}

      {hasNoAgents && (
        <div
          className="col-span-2 flex items-center justify-between gap-3 rounded-[5px] px-3 py-2 t-body"
          style={{
            background: "var(--accent-amber-wash)",
            color: "var(--accent-amber)",
            border: "1px solid color-mix(in oklch, var(--accent-amber) 40%, transparent)",
          }}
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 shrink-0" />
            <span>You have no agents yet.</span>
          </div>
          <button
            onClick={() => openOnboarding({ initialStep: 2, productId: selectedCompanyId })}
            className="sc-btn size-sm variant-ghost"
            style={{ color: "inherit" }}
          >
            Create one
            <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Sprint health — spans both columns */}
      <Card style={{ gridColumn: "span 2" }}>
        <CardHeader
          icon={<Calendar size={14} className="fg-muted" />}
          title={
            <>
              {activeSprint
                ? `Sprint — health`
                : "No active sprint"}
              {activeSprint && (
                <Chip variant="blue" dot>
                  Active
                </Chip>
              )}
            </>
          }
          right={
            activeSprint && (
              <button
                type="button"
                className="sc-btn size-sm variant-ghost"
                onClick={() => navigate(`/sprints/${activeSprint.id}`)}
              >
                Open sprint <ChevronRight size={12} />
              </button>
            )
          }
        />
        <CardBody>
          {activeSprint && sprintSummary ? (
            <div
              className="grid gap-5 items-center"
              style={{ gridTemplateColumns: "1.5fr 1fr 1fr auto" }}
            >
              <div>
                <div className="t-meta fg-muted upper mb-1.5">Goal</div>
                <div className="t-body fg">
                  {activeSprint.goal ?? activeSprint.name}
                </div>
              </div>
              <div>
                <div className="t-meta fg-muted upper mb-1.5">Days remaining</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="t-head num">{sprintDays?.daysRemaining ?? "—"}</span>
                  <span className="fg-muted t-body">
                    / {sprintDays?.totalDays ?? "—"}
                  </span>
                </div>
              </div>
              <div>
                <HealthBar
                  done={sprintSummary.done}
                  committed={sprintSummary.total}
                />
              </div>
              <div className="flex flex-col justify-between self-stretch">
                <div className="t-meta fg-muted upper">Burndown</div>
                <BurndownFromSummary
                  total={sprintSummary.total}
                  remaining={sprintSummary.remaining}
                  totalDays={sprintDays?.totalDays ?? 10}
                  daysElapsed={
                    sprintDays
                      ? Math.max(sprintDays.totalDays - sprintDays.daysRemaining, 0)
                      : 0
                  }
                />
              </div>
            </div>
          ) : (
            <div className="t-body fg-muted">
              Start a sprint to track goal, health, and burndown in one glance.
              <div className="mt-3">
                <Link to="/sprints" className="sc-btn size-sm variant-outline">
                  Go to sprints <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Review queue */}
      <Card>
        <CardHeader
          icon={<Eye size={14} className="fg-muted" />}
          title={
            <>
              Review queue
              <Chip variant="amber">
                {pendingApprovals?.length ?? 0} waiting
              </Chip>
            </>
          }
          right={
            <Link to="/inbox" className="sc-btn size-sm variant-ghost">
              Inbox <Kbd>G N</Kbd>
            </Link>
          }
        />
        <div>
          {pendingApprovals && pendingApprovals.length > 0 ? (
            pendingApprovals.slice(0, 5).map((approval) => {
              const kind = reviewKindFromApprovalType(approval.type);
              const variant = chipVariantForReviewKind(kind.label);
              const issueId = approvalIssueId(approval);
              const issue = issueId ? issueMap.get(issueId) : null;
              return (
                <ListRow
                  key={approval.id}
                  onClick={() => navigate(`/reviews/${approval.id}`)}
                  style={{ borderRadius: 0 }}
                >
                  <Chip
                    variant={variant}
                    square
                    icon={<kind.icon size={11} />}
                  >
                    {kind.label}
                  </Chip>
                  {issue && (
                    <span className="sc-issue-id t-mono">
                      {issue.identifier ?? issue.id.slice(0, 8)}
                    </span>
                  )}
                  <span className="sc-stretch sc-truncate">
                    {approvalTitle(approval)}
                  </span>
                  <span className="fg-muted t-meta">
                    {timeAgo(approval.createdAt)}
                  </span>
                  <button
                    className="sc-btn size-sm variant-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/reviews/${approval.id}`);
                    }}
                  >
                    Review <Kbd>R</Kbd>
                  </button>
                </ListRow>
              );
            })
          ) : (
            <CardBody className="t-body fg-muted">No reviews waiting on you.</CardBody>
          )}
        </div>
      </Card>

      {/* Blocked issues */}
      <Card>
        <CardHeader
          icon={<AlertTriangle size={14} className="fg-muted" />}
          title={
            <>
              Blocked
              {blockedIssues.length > 0 && (
                <Chip variant="amber">{blockedIssues.length}</Chip>
              )}
            </>
          }
          right={
            <Link to="/issues" className="sc-btn size-sm variant-ghost">
              All issues <ChevronRight size={12} />
            </Link>
          }
        />
        <div>
          {blockedIssues.length > 0 ? (
            blockedIssues.map((issue) => {
              const agent = issue.assigneeAgentId ? agentMap.get(issue.assigneeAgentId) : null;
              return (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  assigneeRole={agent?.role ?? null}
                  assigneeName={agent?.name ?? null}
                  onOpen={() => navigate(`/issues/${issue.identifier ?? issue.id}`)}
                  className="rounded-none"
                  dense
                />
              );
            })
          ) : (
            <CardBody className="t-body fg-muted">Nothing blocked. Nice.</CardBody>
          )}
        </div>
      </Card>

      {/* CI failures */}
      <Card>
        <CardHeader
          icon={<Radio size={14} className="fg-muted" />}
          title={
            <>
              Recent run failures
              {ciFailures.length > 0 && <Chip variant="red">{ciFailures.length}</Chip>}
            </>
          }
        />
        <div>
          {ciFailures.length > 0 ? (
            ciFailures.map((run) => {
              const r = run as {
                id: string;
                agentId?: string | null;
                issueId?: string | null;
                status?: string;
                finishedAt?: string | null;
              };
              const agent = r.agentId ? agentMap.get(r.agentId) : null;
              const issue = r.issueId ? issueMap.get(r.issueId) : null;
              return (
                <ListRow
                  key={r.id}
                  onClick={() =>
                    issue
                      ? navigate(`/issues/${issue.identifier ?? issue.id}`)
                      : navigate("/activity")
                  }
                  style={{ borderRadius: 0 }}
                  dense
                >
                  <StatusDot state="fail" />
                  <span className="sc-issue-id t-mono">
                    {issue ? issue.identifier ?? issue.id.slice(0, 8) : "—"}
                  </span>
                  <span className="sc-stretch sc-truncate">
                    {issue?.title ?? (agent ? `${agent.name} run failed` : "Run failed")}
                  </span>
                  {r.finishedAt && (
                    <span className="fg-muted t-meta">{timeAgo(r.finishedAt)}</span>
                  )}
                </ListRow>
              );
            })
          ) : (
            <CardBody className="t-body fg-muted">No recent failures.</CardBody>
          )}
        </div>
      </Card>

      {/* Live agent strip — full width */}
      <Card style={{ gridColumn: "span 2" }}>
        <CardHeader
          icon={<Bot size={14} className="fg-muted" />}
          title={
            <>
              Live work
              {runningAgents.length > 0 && (
                <Chip variant="blue" dot>
                  {runningAgents.length} running
                </Chip>
              )}
            </>
          }
          right={
            <Link to="/agents/all" className="sc-btn size-sm variant-ghost">
              Agents <Kbd>G A</Kbd>
            </Link>
          }
        />
        <CardBody>
          {runningAgents.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {runningAgents.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-[5px] border px-2.5 py-1.5"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--panel-2)",
                  }}
                >
                  <AgentAvatar role={a.role} size={18} title={a.name} />
                  <div className="flex flex-col">
                    <span className="t-body fg">{a.name}</span>
                    <span className="t-meta fg-muted">
                      {a.title ?? a.role}
                    </span>
                  </div>
                  <StatusDot state="running" />
                </div>
              ))}
            </div>
          ) : (
            <div className="t-body fg-muted">No agents are running right now.</div>
          )}
        </CardBody>
      </Card>

      {/* Metrics — summary counts, in the new Card style */}
      {data && (
        <Card style={{ gridColumn: "span 2" }}>
          <CardHeader title={<span className="t-meta upper fg-muted">Summary</span>} />
          <CardBody
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          >
            <MetricTile
              label="Agents online"
              value={data.agents.active + data.agents.running}
              sub={`${data.agents.running} running · ${data.agents.paused} paused · ${data.agents.error} errors`}
              to="/agents/all"
            />
            <MetricTile
              label="Tasks in progress"
              value={data.tasks.inProgress}
              sub={`${data.tasks.open} open · ${data.tasks.blocked} blocked`}
              to="/issues"
            />
            <MetricTile
              label="Pending reviews"
              value={data.pendingApprovals + data.budgets.pendingApprovals}
              sub="Awaiting your decision"
              to="/reviews/pending"
            />
          </CardBody>
        </Card>
      )}

      <PluginSlotOutlet
        slotTypes={["dashboardWidget"]}
        context={{ productId: selectedCompanyId }}
        className="col-span-2 grid gap-3 md:grid-cols-2"
        itemClassName="sc-card p-3"
      />

      {/* Recent activity + recent tasks */}
      {(recentActivity.length > 0 || recentIssues.length > 0) && (
        <>
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader title={<span className="t-meta upper fg-muted">Recent activity</span>} />
              <div>
                {recentActivity.map((event) => (
                  <ActivityRow
                    key={event.id}
                    event={event}
                    agentMap={agentMap}
                    userProfileMap={userProfileMap}
                    entityNameMap={entityNameMap}
                    entityTitleMap={entityTitleMap}
                  />
                ))}
              </div>
            </Card>
          )}
          {recentIssues.length > 0 && (
            <Card>
              <CardHeader title={<span className="t-meta upper fg-muted">Recent tasks</span>} />
              <div>
                {recentIssues.map((issue) => {
                  const agent = issue.assigneeAgentId
                    ? agentMap.get(issue.assigneeAgentId)
                    : null;
                  return (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      assigneeRole={agent?.role ?? null}
                      assigneeName={agent?.name ?? null}
                      onOpen={() => navigate(`/issues/${issue.identifier ?? issue.id}`)}
                      className="rounded-none"
                      dense
                    />
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  to,
}: {
  label: string;
  value: number;
  sub?: string;
  to?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-[5px] px-3 py-2.5 border transition-colors",
        to && "hover:bg-[color:var(--hover)] cursor-pointer",
      )}
      style={{ borderColor: "var(--border-subtle)", background: "var(--panel-2)" }}
    >
      <span className="t-meta fg-muted upper">{label}</span>
      <span className="t-head num">{value}</span>
      {sub && <span className="t-meta fg-muted">{sub}</span>}
    </div>
  );
  return to ? (
    <Link to={to} className="no-underline text-inherit">
      {body}
    </Link>
  ) : (
    body
  );
}

function BurndownFromSummary({
  total,
  remaining,
  totalDays,
  daysElapsed,
}: {
  total: number;
  remaining: number;
  totalDays: number;
  daysElapsed: number;
}) {
  const ideal: number[] = [];
  const actual: number[] = [];
  for (let i = 0; i <= totalDays; i += 1) {
    const t = i / Math.max(totalDays, 1);
    ideal.push(total * (1 - t));
  }
  // Simple linear approximation between "nothing done" at day 0 and current
  // remaining at daysElapsed; tails off flat until the end of the sprint.
  for (let i = 0; i <= totalDays; i += 1) {
    if (i <= daysElapsed) {
      const t = i / Math.max(daysElapsed, 1);
      actual.push(total - (total - remaining) * t);
    } else {
      actual.push(remaining);
    }
  }
  return <Burndown actual={actual} ideal={ideal} w={220} h={56} />;
}
