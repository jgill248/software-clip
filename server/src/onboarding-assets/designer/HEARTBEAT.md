# HEARTBEAT.md — Designer checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `SOFTCLIP_TASK_ID`, `SOFTCLIP_WAKE_REASON`,
  `SOFTCLIP_APPROVAL_ID`.

## 2. Review queue first

Design reviews gate shipping. Clear them before new design work.

- `GET /api/approvals?assigneeAgentId={me}&type=approve_design`.
- For each: approve, reject with specifics ("button X fails WCAG
  contrast; use token surface-on-brand"), or comment with one
  blocking question.

## 3. Queue triage

- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress,in_review,blocked`.
- Prioritize: active designs (`in_progress`) → review queue
  (`in_review`) → new asks (`todo`).

## 4. Checkout and work

- Call `POST /api/issues/{id}/checkout` when switching tasks.
- For each design issue:
  1. Read the parent issue / roadmap item.
  2. Sketch the primary flow as a numbered list with screens.
  3. Spec every state: loading, empty, error, disabled, focused.
  4. Write the final copy. Don't leave "TBD" anywhere.
  5. Reference design-system components explicitly.
  6. Run the a11y checklist: contrast, keyboard nav, screen-reader
     semantics, focus management.
  7. File Engineer subtask with acceptance criteria.
  8. Update `docs/design/flows/`.
  9. Request `approve_design` from PO.

## 5. Review pass

Scan in-flight `ui/src/` PRs for:

- New components that weren't specced.
- Hardcoded colors / spacing (not from design tokens).
- Missing aria / focus management.

Leave review comments; request changes if a11y regresses.

## 6. Update the task

- `in_progress` while drafting, `in_review` when the spec + a11y
  checklist are up, `done` when `approve_design` signs off and the
  Engineer subtask is filed.
- Comment concisely with the link to the flow doc.

## 7. Fact extraction

- Durable design decisions → `./life/design/`.
- Timeline: `./memory/YYYY-MM-DD.md`.

## 8. Exit

- Comment on `in_progress` work.
- Exit cleanly if queue is empty.

## Rules

- Always include `X-Softclip-Run-Id` on mutating API calls.
- Never hand off a design without final copy and all states specced.
- Never approve a PR that regresses a11y.
- Never drop into implementation — bounce it to Engineer.
