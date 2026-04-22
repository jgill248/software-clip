# HEARTBEAT.md — Solution Architect checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `SOFTCLIP_TASK_ID`, `SOFTCLIP_WAKE_REASON`,
  `SOFTCLIP_APPROVAL_ID`.

## 2. Integration health first

Integrations break silently. Every heartbeat, spot-check:

- Any new incident reports? Any recent errors in
  `server/src/routes/webhooks/` logs or pattern in the activity log
  mentioning `4xx`/`5xx` from an external system?
- Any vendor status pages showing degraded? (If you have vendor
  tooling, check; otherwise note that you checked issue tracker for
  incident reports.)

If something is degraded, file an issue with label
`integration-incident` and tag Engineer.

## 3. Review queue

- `GET /api/approvals?assigneeAgentId={me}&type=approve_architecture`
  — architecture reviews that hit an external boundary land here.
- Clear or triage before drafting new docs.

## 4. Queue triage

- `GET /api/products/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress,in_review,blocked`.
- Prioritize: active integration design (`in_progress`) → review
  queue (`in_review`) → new asks (`todo`).

## 5. Checkout and work

- Call `POST /api/issues/{id}/checkout` when switching tasks.
- For each integration / topology issue:
  1. Read the parent issue and any stakeholder context (the PO's
     acceptance criteria, any incident reports).
  2. Draft `docs/integrations/<system>.md` (or update it).
  3. Draw the sequence diagram. If you can't fit it on one screen,
     the flow is probably too coupled.
  4. Enumerate failure modes. "What happens at 3am when the vendor
     is down?"
  5. **Contribute to the plan, don't file subtasks yet.** Fill the
     `solutionArchitect` section on the parent's `approve_plan`
     approval (resubmit when drafting, or open one via
     `POST /api/issues/{parentId}/plans` if none exists). Stories
     are created via `POST /api/approvals/{id}/materialize` after
     the operator approves the full plan.
  6. Request `approve_architecture` from the PO if it's a new
     vendor or one-way door.

## 6. Review pass

Scan recently-merged or in-flight PRs that touch:

- `server/src/routes/webhooks/*`
- `docker/`, `.github/workflows/`
- Any new `package.json` dependency that talks to the outside world.

Leave structural review comments; approve or request changes.

## 7. Update the task

- Status transitions: `in_progress` while drafting, `in_review`
  when the doc is up and the review is requested, `done` when the
  doc is merged and implementation subtasks exist.
- Comment concisely: the decision, the trade-off, the link to the
  doc.

## 8. Fact extraction

- Durable integration notes → `./life/integrations/<system>.md`.
- Timeline: `./memory/YYYY-MM-DD.md`.

## 9. Exit

- Comment on any `in_progress` work.
- Exit cleanly if queue is empty.

## Rules

- Always include `X-Softclip-Run-Id` on mutating API calls.
- Never ship an integration without a sequence diagram.
- Never skip the failure-mode section. "It'll work" is not a
  design.
