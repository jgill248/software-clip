import { useEffect, useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus, Circle, CircleDot, CircleCheck } from "lucide-react";
import { sprintsApi, type Sprint, type SprintState } from "../api/sprints";
import { ApiError } from "../api/client";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToastActions } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { cn, formatDate } from "../lib/utils";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATE_META: Record<
  SprintState,
  { label: string; tone: string; icon: typeof Circle }
> = {
  planned: {
    label: "Planned",
    tone: "text-muted-foreground",
    icon: Circle,
  },
  active: {
    label: "Active",
    tone: "text-emerald-600 dark:text-emerald-400",
    icon: CircleDot,
  },
  closed: {
    label: "Closed",
    tone: "text-muted-foreground",
    icon: CircleCheck,
  },
};

export function Sprints() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Sprints" }]);
  }, [setBreadcrumbs]);

  const { data: sprints, isLoading, error } = useQuery({
    queryKey: queryKeys.sprints.list(selectedCompanyId!),
    queryFn: () => sprintsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  if (!selectedCompanyId) {
    return (
      <EmptyState icon={CalendarRange} message="Select a product to view sprints." />
    );
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      {sprints && sprints.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          message="No sprints yet. Plan the team's first iteration to commit issues against."
          action="Plan a Sprint"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold">Sprints</h2>
              {sprints && (
                <span className="text-xs text-muted-foreground">
                  {sprints.filter((s) => s.state === "active").length} active,{" "}
                  {sprints.filter((s) => s.state === "planned").length} planned
                </span>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Sprint
            </Button>
          </div>
          <ul className="space-y-2">
            {(sprints ?? []).map((sprint) => (
              <SprintRow key={sprint.id} sprint={sprint} />
            ))}
          </ul>
        </>
      )}

      <CreateSprintDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={selectedCompanyId}
      />
    </div>
  );
}

function SprintRow({ sprint }: { sprint: Sprint }) {
  const meta = STATE_META[sprint.state];
  const Icon = meta.icon;
  return (
    <li>
      <Link
        to={`/sprints/${sprint.id}`}
        className="group flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 px-4 py-3 transition-colors hover:border-border hover:bg-card/70"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <Icon className={cn("h-4 w-4 self-center", meta.tone)} />
            <span className="font-medium">{sprint.name}</span>
            <span className="text-xs text-muted-foreground">{meta.label}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {sprint.startsAt ? formatDate(sprint.startsAt) : "—"}{" "}
            →{" "}
            {sprint.endsAt ? formatDate(sprint.endsAt) : "—"}
          </span>
        </div>
        {sprint.goal && (
          <p className="text-sm text-muted-foreground line-clamp-2">{sprint.goal}</p>
        )}
      </Link>
    </li>
  );
}

function CreateSprintDialog({
  open,
  onOpenChange,
  companyId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
}) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      sprintsApi.create(companyId, {
        name: name.trim(),
        goal: goal.trim() || null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.list(companyId) });
      onOpenChange(false);
      setName("");
      setGoal("");
      setStartsAt("");
      setEndsAt("");
      pushToast({
        title: "Sprint planned",
        body: "The sprint starts in `planned` state. Activate it when the team is ready.",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Couldn't create sprint",
        body: err instanceof ApiError ? err.message : String(err),
        tone: "error",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plan a new sprint</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate();
          }}
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 7"
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Sprint goal (optional)
            </label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="One sentence: what must be true at close?"
              rows={2}
              maxLength={4000}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Starts at
              </label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Ends at
              </label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              Plan sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
