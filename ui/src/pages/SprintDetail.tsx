import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Square, Trash2 } from "lucide-react";
import { sprintsApi, type Sprint, type SprintState } from "../api/sprints";
import { ApiError } from "../api/client";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToastActions } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { formatDate, issueUrl, cn } from "../lib/utils";
import { PageSkeleton } from "../components/PageSkeleton";
import { Card, CardHeader, CardBody } from "@/components/softclip/Card";
import { Chip } from "@/components/softclip/Chip";
import { HealthBar } from "@/components/softclip/HealthBar";
import { Burndown } from "@/components/softclip/Burndown";
import { StatusIcon, STATUS_LABEL } from "@/components/softclip/StatusIcon";
import { PriorityBars } from "@/components/softclip/PriorityBars";
import type { IssuePriority, IssueStatus } from "@softclipai/shared";

type SprintIssueRow = {
  id: string;
  productId: string;
  title: string;
  status: IssueStatus | string;
  priority: IssuePriority;
  identifier: string | null;
  isStretch: boolean;
};

const COLUMN_ORDER: Array<{ status: IssueStatus; label: string }> = [
  { status: "todo", label: "Todo" },
  { status: "in_progress", label: "In progress" },
  { status: "in_review", label: "In review" },
  { status: "done", label: "Done" },
];

export function SprintDetail() {
  const { sprintId } = useParams();
  const { setBreadcrumbs, setRightActions } = useBreadcrumbs();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const { data: sprint, isLoading, error } = useQuery({
    queryKey: queryKeys.sprints.detail(sprintId!),
    queryFn: () => sprintsApi.get(sprintId!),
    enabled: !!sprintId,
  });

  const { data: issuesRaw } = useQuery({
    queryKey: queryKeys.sprints.issues(sprintId!),
    queryFn: () => sprintsApi.listIssues(sprintId!),
    enabled: !!sprintId,
    staleTime: 10_000,
  });

  const { data: summary } = useQuery({
    queryKey: queryKeys.sprints.summary(sprintId!),
    queryFn: () => sprintsApi.summary(sprintId!),
    enabled: !!sprintId,
    staleTime: 10_000,
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Sprints", href: "/sprints" },
      { label: sprint?.name ?? "Sprint" },
    ]);
  }, [setBreadcrumbs, sprint?.name]);

  const issues = useMemo<SprintIssueRow[]>(() => {
    if (!Array.isArray(issuesRaw)) return [];
    return issuesRaw.map((row) => ({
      id: String(row.id),
      productId: String(row.productId ?? ""),
      title: String(row.title ?? "Untitled"),
      status: String(row.status ?? "backlog") as IssueStatus,
      priority: (row.priority as IssuePriority) ?? "medium",
      identifier:
        typeof row.identifier === "string" && row.identifier.length > 0
          ? row.identifier
          : null,
      isStretch: Boolean((row as { isStretch?: boolean }).isStretch),
    }));
  }, [issuesRaw]);

  const issuesByStatus = useMemo(() => {
    const grouped = new Map<IssueStatus, SprintIssueRow[]>();
    for (const col of COLUMN_ORDER) grouped.set(col.status, []);
    for (const issue of issues) {
      const key = (grouped.has(issue.status as IssueStatus)
        ? (issue.status as IssueStatus)
        : "todo") as IssueStatus;
      grouped.get(key)!.push(issue);
    }
    return grouped;
  }, [issues]);

  const sprintDays = useMemo(() => {
    if (!sprint?.startsAt || !sprint?.endsAt) return null;
    const start = new Date(sprint.startsAt).getTime();
    const end = new Date(sprint.endsAt).getTime();
    const now = Date.now();
    const totalDays = Math.max(Math.round((end - start) / 86_400_000), 1);
    const daysRemaining = Math.max(Math.round((end - now) / 86_400_000), 0);
    return { totalDays, daysRemaining };
  }, [sprint]);

  function invalidate() {
    if (!sprintId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.detail(sprintId) });
    if (sprint?.productId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(sprint.productId),
      });
    }
  }

  const transitionMutation = useMutation({
    mutationFn: (nextState: SprintState) =>
      sprintsApi.update(sprintId!, { state: nextState }),
    onSuccess: invalidate,
    onError: (err) => {
      pushToast({
        title: "Couldn't change sprint state",
        body: err instanceof ApiError ? err.message : String(err),
        tone: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => sprintsApi.remove(sprintId!),
    onSuccess: () => {
      pushToast({ title: "Sprint deleted", body: "", tone: "success" });
      navigate("/sprints");
    },
    onError: (err) => {
      pushToast({
        title: "Couldn't delete sprint",
        body: err instanceof ApiError ? err.message : String(err),
        tone: "error",
      });
    },
  });

  const pending = transitionMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (!sprint) return;
    setRightActions(
      <StateControlsInline
        sprint={sprint}
        pending={pending}
        onActivate={() => transitionMutation.mutate("active")}
        onClose={() => transitionMutation.mutate("closed")}
        onDelete={() => {
          if (confirm(`Delete "${sprint.name}"? This can't be undone.`)) {
            deleteMutation.mutate();
          }
        }}
      />,
    );
    return () => setRightActions(null);
  }, [sprint, pending, setRightActions, transitionMutation, deleteMutation]);

  if (isLoading || !sprint) {
    return <PageSkeleton variant="detail" />;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {(error as Error).message ?? "Couldn't load sprint."}
      </p>
    );
  }

  const stateVariant: "blue" | "default" =
    sprint.state === "active" ? "blue" : "default";
  const stateLabel =
    sprint.state === "active"
      ? "Active"
      : sprint.state === "closed"
        ? "Closed"
        : "Planned";

  return (
    <div className="space-y-4" style={{ maxWidth: 1400 }}>
      <div>
        <Link
          to="/sprints"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All sprints
        </Link>
      </div>

      {/* Goal + metrics card */}
      <Card>
        <CardBody
          className="grid gap-5 items-center"
          style={{ gridTemplateColumns: "minmax(0, 2fr) repeat(3, minmax(0, 1fr)) auto" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Chip variant={stateVariant} dot={sprint.state === "active"}>
                {stateLabel}
              </Chip>
              <span className="t-body fg-muted">{sprint.name}</span>
            </div>
            <div className="t-head" style={{ fontSize: 20 }}>
              {sprint.goal ?? sprint.name}
            </div>
            <div className="t-meta fg-muted mt-1">
              {sprint.startsAt ? formatDate(sprint.startsAt) : "—"} →{" "}
              {sprint.endsAt ? formatDate(sprint.endsAt) : "—"}
            </div>
          </div>
          <div>
            <div className="t-meta fg-muted upper mb-1.5">Committed</div>
            <div className="t-head num">{summary?.total ?? "—"}</div>
          </div>
          <div>
            <div className="t-meta fg-muted upper mb-1.5">Done</div>
            <div className="t-head num">{summary?.done ?? "—"}</div>
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
          <div className="self-stretch flex flex-col justify-between">
            <div className="t-meta fg-muted upper">Burndown</div>
            {summary && (
              <BurndownFromSummary
                total={summary.total}
                remaining={summary.remaining}
                totalDays={sprintDays?.totalDays ?? 10}
                daysElapsed={
                  sprintDays
                    ? Math.max(sprintDays.totalDays - sprintDays.daysRemaining, 0)
                    : 0
                }
              />
            )}
          </div>
        </CardBody>
        {summary && (
          <CardBody style={{ paddingTop: 0 }}>
            <HealthBar done={summary.done} committed={summary.total} />
          </CardBody>
        )}
      </Card>

      {/* Kanban columns */}
      {issues.length === 0 ? (
        <Card>
          <CardBody className="t-body fg-muted">
            No issues committed to this sprint yet. Assign issues via the issue
            page's sprint selector or{" "}
            <code className="t-mono t-meta">POST /api/issues/:id/sprint</code>.
          </CardBody>
        </Card>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          {COLUMN_ORDER.map((col) => {
            const colIssues = issuesByStatus.get(col.status) ?? [];
            return (
              <Card key={col.status} className="min-h-[200px]">
                <CardHeader
                  title={
                    <span className="t-meta upper fg-muted">
                      {col.label}{" "}
                      <span className="fg-faint num">· {colIssues.length}</span>
                    </span>
                  }
                />
                <div className="flex flex-col gap-1.5 p-2">
                  {colIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      to={issueUrl(issue)}
                      className={cn(
                        "no-underline text-inherit rounded-[5px] border px-2.5 py-2 transition-colors hover:bg-[color:var(--hover)]",
                      )}
                      style={{
                        background: "var(--panel-2)",
                        borderColor: issue.isStretch ? "transparent" : "var(--border-subtle)",
                        borderStyle: issue.isStretch ? "dashed" : "solid",
                        borderWidth: 1,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <PriorityBars priority={issue.priority} size={12} />
                        <StatusIcon status={issue.status} size={12} />
                        {issue.identifier && (
                          <span className="sc-issue-id t-mono">
                            {issue.identifier}
                          </span>
                        )}
                        {issue.isStretch && (
                          <Chip className="ml-auto" square>
                            Stretch
                          </Chip>
                        )}
                      </div>
                      <div className="t-body fg line-clamp-2">{issue.title}</div>
                      <div className="t-meta fg-muted mt-1">
                        {STATUS_LABEL[issue.status] ?? issue.status}
                      </div>
                    </Link>
                  ))}
                  {colIssues.length === 0 && (
                    <div
                      className="t-meta fg-faint text-center py-4 rounded-[5px] border border-dashed"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      None
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StateControlsInline({
  sprint,
  pending,
  onActivate,
  onClose,
  onDelete,
}: {
  sprint: Sprint;
  pending: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  if (sprint.state === "planned") {
    return (
      <>
        <button
          type="button"
          className="sc-btn size-sm variant-ghost"
          disabled={pending}
          onClick={onDelete}
        >
          <Trash2 size={12} />
          Delete
        </button>
        <button
          type="button"
          className="sc-btn size-sm variant-outline"
          disabled={pending}
          onClick={onActivate}
        >
          <Play size={12} />
          Activate
        </button>
      </>
    );
  }
  if (sprint.state === "active") {
    return (
      <button
        type="button"
        className="sc-btn size-sm variant-outline"
        disabled={pending}
        onClick={onClose}
      >
        <Square size={12} />
        Close sprint
      </button>
    );
  }
  return null;
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
