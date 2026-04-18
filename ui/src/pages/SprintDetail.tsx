import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Play,
  Square,
  Trash2,
  Circle,
  CircleDot,
  CircleCheck,
} from "lucide-react";
import { sprintsApi, type Sprint, type SprintState } from "../api/sprints";
import { ApiError } from "../api/client";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToastActions } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { cn, formatDate, issueUrl } from "../lib/utils";
import { PageSkeleton } from "../components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { StatusIcon } from "../components/StatusIcon";
import { PriorityIcon } from "../components/PriorityIcon";

const STATE_META: Record<
  SprintState,
  { label: string; tone: string; icon: typeof Circle }
> = {
  planned: { label: "Planned", tone: "text-muted-foreground", icon: Circle },
  active: {
    label: "Active",
    tone: "text-emerald-600 dark:text-emerald-400",
    icon: CircleDot,
  },
  closed: { label: "Closed", tone: "text-muted-foreground", icon: CircleCheck },
};

type SprintIssueRow = {
  id: string;
  companyId: string;
  title: string;
  status: string;
  priority: string;
  identifier: string | null;
};

export function SprintDetail() {
  const { sprintId } = useParams();
  const { setBreadcrumbs } = useBreadcrumbs();
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
      companyId: String(row.companyId ?? ""),
      title: String(row.title ?? "Untitled"),
      status: String(row.status ?? "backlog"),
      priority: String(row.priority ?? "medium"),
      identifier:
        typeof row.identifier === "string" && row.identifier.length > 0
          ? row.identifier
          : null,
    }));
  }, [issuesRaw]);

  function invalidate() {
    if (!sprintId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.sprints.detail(sprintId) });
    if (sprint?.companyId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(sprint.companyId),
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

  const meta = STATE_META[sprint.state];
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/sprints"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All sprints
        </Link>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <Icon className={cn("h-5 w-5 self-center", meta.tone)} />
          <h1 className="text-xl font-semibold">{sprint.name}</h1>
          <span className={cn("text-sm", meta.tone)}>{meta.label}</span>
        </div>
        {sprint.goal && (
          <p className="max-w-2xl text-sm leading-6 text-foreground/80 whitespace-pre-wrap">
            {sprint.goal}
          </p>
        )}
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline font-medium">Starts: </dt>
            <dd className="inline">
              {sprint.startsAt ? formatDate(sprint.startsAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Ends: </dt>
            <dd className="inline">
              {sprint.endsAt ? formatDate(sprint.endsAt) : "—"}
            </dd>
          </div>
          {sprint.activatedAt && (
            <div>
              <dt className="inline font-medium">Activated: </dt>
              <dd className="inline">{formatDate(sprint.activatedAt)}</dd>
            </div>
          )}
          {sprint.closedAt && (
            <div>
              <dt className="inline font-medium">Closed: </dt>
              <dd className="inline">{formatDate(sprint.closedAt)}</dd>
            </div>
          )}
        </dl>
      </header>

      <SprintStateControls
        sprint={sprint}
        pending={transitionMutation.isPending || deleteMutation.isPending}
        onActivate={() => transitionMutation.mutate("active")}
        onClose={() => transitionMutation.mutate("closed")}
        onDelete={() => {
          if (confirm(`Delete "${sprint.name}"? This can't be undone.`)) {
            deleteMutation.mutate();
          }
        }}
      />

      {summary && <SprintBurndown summary={summary} />}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Issues</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No issues committed to this sprint yet. Assign an issue by calling{" "}
            <code className="text-xs">POST /api/issues/:id/sprint</code> or use the
            sprint selector on the issue page (coming in a follow-up UI chunk).
          </p>
        ) : (
          <ul className="space-y-1">
            {issues.map((issue) => (
              <li key={issue.id}>
                <Link
                  to={issueUrl(issue)}
                  className="group flex items-center gap-2 rounded-md border border-border/60 bg-card/30 px-3 py-2 transition-colors hover:border-border hover:bg-card/60"
                >
                  <StatusIcon status={issue.status} />
                  <PriorityIcon priority={issue.priority} />
                  {issue.identifier && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {issue.identifier}
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm">{issue.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SprintStateControls({
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
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sprint.state === "planned" && (
        <>
          <Button size="sm" onClick={onActivate} disabled={pending}>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Activate
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} disabled={pending}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </>
      )}
      {sprint.state === "active" && (
        <Button size="sm" variant="outline" onClick={onClose} disabled={pending}>
          <Square className="mr-1.5 h-3.5 w-3.5" />
          Close sprint
        </Button>
      )}
      {sprint.state === "closed" && (
        <span className="text-xs text-muted-foreground">
          This sprint is closed. Create a new one to plan the next iteration.
        </span>
      )}
    </div>
  );
}

function SprintBurndown({
  summary,
}: {
  summary: { total: number; done: number; inProgress: number; remaining: number };
}) {
  const donePct =
    summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">Burndown</span>
        <span className="text-muted-foreground">
          {summary.done} done · {summary.inProgress} in progress ·{" "}
          {summary.remaining} remaining of {summary.total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-emerald-500/70 transition-all"
          style={{ width: `${donePct}%` }}
        />
      </div>
    </section>
  );
}
