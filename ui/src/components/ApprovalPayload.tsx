import {
  UserPlus,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  GitPullRequest,
  PenTool,
  Building2,
} from "lucide-react";
import { formatCents } from "../lib/utils";

export const typeLabel: Record<string, string> = {
  hire_agent: "Hire Agent",
  // approve_ceo_strategy is the legacy name; approve_po_strategy is the
  // Softclip-pivot replacement. Both render under the same rubric.
  approve_ceo_strategy: "Roadmap Approval",
  approve_po_strategy: "Roadmap Approval",
  approve_pr: "Code Review",
  approve_design: "Design Review",
  approve_architecture: "Architecture Review",
  budget_override_required: "Budget Override",
  request_board_approval: "Board Approval",
};

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export function approvalSubject(payload?: Record<string, unknown> | null): string | null {
  return firstNonEmptyString(
    payload?.title,
    payload?.name,
    payload?.summary,
    payload?.recommendedAction,
  );
}

/** Build a contextual label for an approval, e.g. "Hire Agent: Designer" */
export function approvalLabel(type: string, payload?: Record<string, unknown> | null): string {
  const base = typeLabel[type] ?? type;
  const subject = approvalSubject(payload);
  if (subject) {
    return `${base}: ${subject}`;
  }
  return base;
}

export const typeIcon: Record<string, typeof UserPlus> = {
  hire_agent: UserPlus,
  approve_ceo_strategy: Lightbulb,
  approve_po_strategy: Lightbulb,
  approve_pr: GitPullRequest,
  approve_design: PenTool,
  approve_architecture: Building2,
  budget_override_required: ShieldAlert,
  request_board_approval: ShieldCheck,
};

export const defaultTypeIcon = ShieldCheck;

function PayloadField({ label, value }: { label: string; value: unknown }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">{label}</span>
      <span>{String(value)}</span>
    </div>
  );
}

function SkillList({ values }: { values: unknown }) {
  if (!Array.isArray(values)) return null;
  const items = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs pt-0.5">Skills</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HireAgentPayload({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="mt-3 space-y-1.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">Name</span>
        <span className="font-medium">{String(payload.name ?? "—")}</span>
      </div>
      <PayloadField label="Role" value={payload.role} />
      <PayloadField label="Title" value={payload.title} />
      <PayloadField label="Icon" value={payload.icon} />
      {!!payload.capabilities && (
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs pt-0.5">Capabilities</span>
          <span className="text-muted-foreground">{String(payload.capabilities)}</span>
        </div>
      )}
      {!!payload.adapterType && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">Adapter</span>
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
            {String(payload.adapterType)}
          </span>
        </div>
      )}
      <SkillList values={payload.desiredSkills} />
    </div>
  );
}

export function CeoStrategyPayload({ payload }: { payload: Record<string, unknown> }) {
  const plan = payload.plan ?? payload.description ?? payload.strategy ?? payload.text;
  return (
    <div className="mt-3 space-y-1.5 text-sm">
      <PayloadField label="Title" value={payload.title} />
      {!!plan && (
        <div className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap font-mono text-xs max-h-48 overflow-y-auto">
          {String(plan)}
        </div>
      )}
      {!plan && (
        <pre className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground overflow-x-auto max-h-48">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function BudgetOverridePayload({ payload }: { payload: Record<string, unknown> }) {
  const budgetAmount = typeof payload.budgetAmount === "number" ? payload.budgetAmount : null;
  const observedAmount = typeof payload.observedAmount === "number" ? payload.observedAmount : null;
  return (
    <div className="mt-3 space-y-1.5 text-sm">
      <PayloadField label="Scope" value={payload.scopeName ?? payload.scopeType} />
      <PayloadField label="Window" value={payload.windowKind} />
      <PayloadField label="Metric" value={payload.metric} />
      {(budgetAmount !== null || observedAmount !== null) ? (
        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Limit {budgetAmount !== null ? formatCents(budgetAmount) : "—"} · Observed {observedAmount !== null ? formatCents(observedAmount) : "—"}
        </div>
      ) : null}
      {!!payload.guidance && (
        <p className="text-muted-foreground">{String(payload.guidance)}</p>
      )}
    </div>
  );
}

export function BoardApprovalPayload({
  payload,
  hideTitle = false,
}: {
  payload: Record<string, unknown>;
  hideTitle?: boolean;
}) {
  const nextPayload = hideTitle ? { ...payload, title: undefined } : payload;
  return (
    <BoardApprovalPayloadContent payload={nextPayload} />
  );
}

function BoardApprovalPayloadContent({ payload }: { payload: Record<string, unknown> }) {
  const risks = Array.isArray(payload.risks)
    ? payload.risks
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const title = firstNonEmptyString(payload.title);
  const summary = firstNonEmptyString(payload.summary);
  const recommendedAction = firstNonEmptyString(payload.recommendedAction);
  const nextActionOnApproval = firstNonEmptyString(payload.nextActionOnApproval);
  const proposedComment = firstNonEmptyString(payload.proposedComment);

  return (
    <div className="mt-4 space-y-3.5 text-sm">
      {title && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Title</p>
          <p className="font-medium leading-6 text-foreground">{title}</p>
        </div>
      )}
      {summary && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Summary</p>
          <p className="leading-6 text-foreground/90">{summary}</p>
        </div>
      )}
      {recommendedAction && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
            Recommended action
          </p>
          <p className="mt-1 leading-6 text-foreground">{recommendedAction}</p>
        </div>
      )}
      {nextActionOnApproval && (
        <div className="rounded-lg border border-border/60 bg-background/60 px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">On approval</p>
          <p className="mt-1 leading-6 text-foreground">{nextActionOnApproval}</p>
        </div>
      )}
      {risks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Risks</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {risks.map((risk) => (
              <li key={risk} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                <span className="leading-6">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {proposedComment && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Proposed comment
          </p>
          <pre className="max-h-48 overflow-auto rounded-lg border border-border/60 bg-muted/50 px-3.5 py-3 font-mono text-xs leading-5 text-muted-foreground whitespace-pre-wrap">
            {proposedComment}
          </pre>
        </div>
      )}
    </div>
  );
}

export function CodeReviewPayload({ payload }: { payload: Record<string, unknown> }) {
  const prUrl = firstNonEmptyString(payload.prUrl);
  const summary = firstNonEmptyString(payload.summary);
  const changes = firstNonEmptyString(payload.changesSummary);
  const ciStatus = firstNonEmptyString(payload.ciStatus);
  const recommendedAction = firstNonEmptyString(payload.recommendedAction);
  const branch = firstNonEmptyString(payload.branch);
  const repo = firstNonEmptyString(payload.repo);
  const prNumber =
    typeof payload.prNumber === "number" ? payload.prNumber : null;

  return (
    <div className="mt-3 space-y-2 text-sm">
      {prUrl && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">PR</span>
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs underline underline-offset-2 hover:text-primary"
          >
            {repo && prNumber !== null ? `${repo}#${prNumber}` : prUrl}
          </a>
        </div>
      )}
      {!prUrl && (repo || prNumber !== null) && (
        <PayloadField
          label="PR"
          value={repo && prNumber !== null ? `${repo}#${prNumber}` : repo ?? `#${prNumber}`}
        />
      )}
      <PayloadField label="Branch" value={branch} />
      {ciStatus && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">CI</span>
          <span
            className={
              ciStatus === "passing"
                ? "rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                : ciStatus === "failing"
                  ? "rounded bg-rose-500/15 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300"
                  : "rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            }
          >
            {ciStatus}
          </span>
        </div>
      )}
      {summary && (
        <div className="space-y-1 pt-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Summary
          </p>
          <p className="leading-6 text-foreground/90">{summary}</p>
        </div>
      )}
      {changes && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Changes
          </p>
          <pre className="max-h-40 overflow-auto rounded-md bg-muted/40 px-3 py-2 font-mono text-xs leading-5 text-muted-foreground whitespace-pre-wrap">
            {changes}
          </pre>
        </div>
      )}
      {recommendedAction && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm leading-6">
          {recommendedAction}
        </div>
      )}
    </div>
  );
}

export function DesignReviewPayload({ payload }: { payload: Record<string, unknown> }) {
  const summary = firstNonEmptyString(payload.summary);
  const wireframeUrl = firstNonEmptyString(payload.wireframeUrl);
  const prototypeUrl = firstNonEmptyString(payload.prototypeUrl);
  const notes = firstNonEmptyString(payload.notes);
  const copyReady = payload.copyReady === true;
  const a11yReviewed = payload.a11yReviewed === true;
  const states = Array.isArray(payload.states)
    ? payload.states.filter((s): s is string => typeof s === "string")
    : [];

  return (
    <div className="mt-3 space-y-2 text-sm">
      {wireframeUrl && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">Wireframe</span>
          <a
            href={wireframeUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            {wireframeUrl}
          </a>
        </div>
      )}
      {prototypeUrl && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">Prototype</span>
          <a
            href={prototypeUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            {prototypeUrl}
          </a>
        </div>
      )}
      {summary && (
        <div className="space-y-1 pt-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Summary
          </p>
          <p className="leading-6 text-foreground/90">{summary}</p>
        </div>
      )}
      {states.length > 0 && (
        <div className="flex items-start gap-2 pt-1">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs pt-0.5">States</span>
          <div className="flex flex-wrap gap-1.5">
            {states.map((state) => (
              <span
                key={state}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {state}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <span
          className={
            copyReady
              ? "rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
              : "rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          }
        >
          {copyReady ? "copy ready" : "copy pending"}
        </span>
        <span
          className={
            a11yReviewed
              ? "rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
              : "rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          }
        >
          {a11yReviewed ? "a11y reviewed" : "a11y pending"}
        </span>
      </div>
      {notes && (
        <p className="rounded-md bg-muted/40 px-3 py-2 text-sm leading-6 text-muted-foreground">
          {notes}
        </p>
      )}
    </div>
  );
}

export function ArchitectureReviewPayload({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const summary = firstNonEmptyString(payload.summary);
  const adrUrl = firstNonEmptyString(payload.adrUrl);
  const tradeOffs = firstNonEmptyString(payload.tradeOffs);
  const rollbackPlan = firstNonEmptyString(payload.rollbackPlan);
  const impact = firstNonEmptyString(payload.impact);
  const affectedAreas = Array.isArray(payload.affectedAreas)
    ? payload.affectedAreas.filter((s): s is string => typeof s === "string")
    : [];

  return (
    <div className="mt-3 space-y-2 text-sm">
      {adrUrl && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">ADR</span>
          <a
            href={adrUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            {adrUrl}
          </a>
        </div>
      )}
      {impact && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs">Impact</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {impact}
          </span>
        </div>
      )}
      {summary && (
        <div className="space-y-1 pt-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Summary
          </p>
          <p className="leading-6 text-foreground/90">{summary}</p>
        </div>
      )}
      {affectedAreas.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground w-20 sm:w-24 shrink-0 text-xs pt-0.5">Areas</span>
          <div className="flex flex-wrap gap-1.5">
            {affectedAreas.map((area) => (
              <span
                key={area}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
      {tradeOffs && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Trade-offs
          </p>
          <p className="leading-6 text-foreground/90 whitespace-pre-wrap">{tradeOffs}</p>
        </div>
      )}
      {rollbackPlan && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Rollback plan
          </p>
          <p className="leading-6 text-foreground/90 whitespace-pre-wrap">{rollbackPlan}</p>
        </div>
      )}
    </div>
  );
}

export function ApprovalPayloadRenderer({
  type,
  payload,
  hidePrimaryTitle = false,
}: {
  type: string;
  payload: Record<string, unknown>;
  hidePrimaryTitle?: boolean;
}) {
  if (type === "hire_agent") return <HireAgentPayload payload={payload} />;
  if (type === "budget_override_required") return <BudgetOverridePayload payload={payload} />;
  if (type === "request_board_approval") {
    return <BoardApprovalPayload payload={payload} hideTitle={hidePrimaryTitle} />;
  }
  if (type === "approve_pr") return <CodeReviewPayload payload={payload} />;
  if (type === "approve_design") return <DesignReviewPayload payload={payload} />;
  if (type === "approve_architecture") return <ArchitectureReviewPayload payload={payload} />;
  return <CeoStrategyPayload payload={payload} />;
}
