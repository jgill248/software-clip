import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2, X, CircleDashed, CircleCheck, CircleSlash } from "lucide-react";
import {
  acceptanceCriteriaApi,
  type AcceptanceCriterion,
  type AcceptanceCriterionStatus,
} from "../api/acceptance-criteria";
import { ApiError } from "../api/client";
import { queryKeys } from "../lib/queryKeys";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AcceptanceCriteriaPanelProps {
  issueId: string;
  /** When true, all mutations render as disabled (viewer mode). */
  readOnly?: boolean;
}

const STATUS_META: Record<
  AcceptanceCriterionStatus,
  { label: string; icon: typeof CircleDashed; tone: string }
> = {
  pending: {
    label: "Pending",
    icon: CircleDashed,
    tone: "text-muted-foreground",
  },
  met: {
    label: "Met",
    icon: CircleCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  waived: {
    label: "Waived",
    icon: CircleSlash,
    tone: "text-amber-600 dark:text-amber-400",
  },
};

export function AcceptanceCriteriaPanel({
  issueId,
  readOnly = false,
}: AcceptanceCriteriaPanelProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.issues.acceptanceCriteria(issueId),
    queryFn: () => acceptanceCriteriaApi.list(issueId),
    staleTime: 5_000,
  });

  function invalidate() {
    queryClient.invalidateQueries({
      queryKey: queryKeys.issues.acceptanceCriteria(issueId),
    });
    // The issue's status may change in response (close-guard flips the
    // `definitionOfDoneMet` flag on successful close). Invalidate the
    // detail so the status pill refreshes.
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) });
  }

  const createMutation = useMutation({
    mutationFn: (text: string) => acceptanceCriteriaApi.create(issueId, { text }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Parameters<typeof acceptanceCriteriaApi.update>[1];
    }) => acceptanceCriteriaApi.update(id, patch),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => acceptanceCriteriaApi.delete(id),
    onSuccess: invalidate,
  });

  const [draft, setDraft] = useState("");
  const [showWaiveInputFor, setShowWaiveInputFor] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState("");

  function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    createMutation.mutate(text, {
      onSuccess: () => setDraft(""),
    });
  }

  function cycleStatus(row: AcceptanceCriterion) {
    if (row.status === "pending") {
      updateMutation.mutate({ id: row.id, patch: { status: "met" } });
      return;
    }
    if (row.status === "met") {
      updateMutation.mutate({ id: row.id, patch: { status: "pending" } });
      return;
    }
    // waived → pending (clears waivedReason server-side)
    updateMutation.mutate({ id: row.id, patch: { status: "pending" } });
  }

  function startWaive(row: AcceptanceCriterion) {
    setShowWaiveInputFor(row.id);
    setWaiveReason(row.waivedReason ?? "");
  }

  function submitWaive(row: AcceptanceCriterion) {
    const reason = waiveReason.trim();
    if (!reason) return;
    updateMutation.mutate(
      { id: row.id, patch: { status: "waived", waivedReason: reason } },
      {
        onSuccess: () => {
          setShowWaiveInputFor(null);
          setWaiveReason("");
        },
      },
    );
  }

  const items = data?.items ?? [];
  const summary = data?.summary ?? { total: 0, met: 0, waived: 0, pending: 0 };

  if (isLoading && items.length === 0) {
    return (
      <section className="space-y-2">
        <Header summary={summary} />
        <p className="text-sm text-muted-foreground">Loading acceptance criteria…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-2">
        <Header summary={summary} />
        <p className="text-sm text-destructive">
          {error instanceof ApiError
            ? error.message
            : "Couldn't load acceptance criteria."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <Header summary={summary} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No acceptance criteria yet. Add the testable conditions this issue
          must satisfy before it can close.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((row) => {
            const meta = STATUS_META[row.status];
            const Icon = meta.icon;
            const isWaiving = showWaiveInputFor === row.id;
            return (
              <li
                key={row.id}
                className="group flex items-start gap-2 rounded-md border border-border/60 bg-card/40 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => cycleStatus(row)}
                  disabled={readOnly || updateMutation.isPending}
                  className={cn(
                    "mt-0.5 rounded-full p-0.5 transition-colors hover:bg-accent/50",
                    meta.tone,
                    readOnly && "cursor-not-allowed opacity-60",
                  )}
                  aria-label={`Status: ${meta.label}`}
                  title={`${meta.label} — click to cycle`}
                >
                  <Icon className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className={cn(
                      "break-words text-sm leading-5",
                      row.status === "met" && "text-muted-foreground line-through",
                      row.status === "waived" && "text-muted-foreground",
                    )}
                  >
                    {row.text}
                  </p>
                  {row.status === "waived" && row.waivedReason && (
                    <p className="text-xs italic text-muted-foreground">
                      Waived: {row.waivedReason}
                    </p>
                  )}
                  {isWaiving && (
                    <div className="flex items-start gap-2 pt-1">
                      <Textarea
                        value={waiveReason}
                        onChange={(event) => setWaiveReason(event.target.value)}
                        placeholder="Reason for waiving this criterion"
                        className="min-h-[2.25rem] flex-1 text-sm"
                        disabled={updateMutation.isPending}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => submitWaive(row)}
                          disabled={
                            updateMutation.isPending || waiveReason.trim().length === 0
                          }
                        >
                          Waive
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowWaiveInputFor(null);
                            setWaiveReason("");
                          }}
                          disabled={updateMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {!readOnly && !isWaiving && (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {row.status !== "waived" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => startWaive(row)}
                        disabled={updateMutation.isPending}
                        title="Waive with reason"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${row.text.slice(0, 60)}"?`)) {
                          deleteMutation.mutate(row.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAdd();
          }}
          className="flex items-start gap-2"
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. User can export their notes as CSV"
            disabled={createMutation.isPending}
            maxLength={2000}
          />
          <Button
            type="submit"
            size="sm"
            disabled={createMutation.isPending || draft.trim().length === 0}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </form>
      )}

      {createMutation.isError && (
        <p className="text-sm text-destructive">
          {createMutation.error instanceof ApiError
            ? createMutation.error.message
            : "Couldn't add the criterion."}
        </p>
      )}
    </section>
  );
}

function Header({
  summary,
}: {
  summary: { total: number; met: number; waived: number; pending: number };
}) {
  const done = summary.met + summary.waived;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold">Acceptance criteria</h3>
        {summary.total > 0 ? (
          <span className="text-xs text-muted-foreground">
            {done} / {summary.total} satisfied
            {summary.waived > 0 ? ` (${summary.waived} waived)` : ""}
          </span>
        ) : null}
      </div>
      {summary.total > 0 && summary.pending === 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          <Check className="h-3 w-3" />
          Ready to close
        </span>
      )}
      {summary.pending > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
          <CircleDashed className="h-3 w-3" />
          {summary.pending} pending — close blocked
        </span>
      )}
    </div>
  );
}
