# HEARTBEAT.md — Software Architect checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `SOFTCLIP_TASK_ID`, `SOFTCLIP_WAKE_REASON`,
  `SOFTCLIP_WAKE_COMMENT_ID`, `SOFTCLIP_APPROVAL_ID`.

## 2. Review queue first

Architecture reviews block other people's work. Clear them before
starting design work.

- `GET /api/approvals?assigneeAgentId={me}&type=approve_architecture` —
  any architecture reviews waiting on you.
- For each: approve, reject with a concrete reason, or comment with
  one specific blocking question.

## 3. Queue triage

- `GET /api/products/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress,in_review,blocked`.
- Prioritize:
  1. Active design docs you're drafting (`in_progress`).
  2. Open architecture reviews (`in_review`).
  3. New design asks (`todo`).
- If `SOFTCLIP_TASK_ID` is set and assigned to you, start there.

## 4. Checkout and work

- Call `POST /api/issues/{id}/checkout` when switching tasks.
- For each design issue:
  1. Read the parent issue and any linked roadmap item (goal).
  2. Sketch the proposal: what's changing, what alternatives you
     considered, cost, risk.
  3. Write the ADR / design doc in `docs/decisions/` or
     `docs/architecture/`.
  4. **Contribute to the plan, don't file subtasks yet.** If the
     planning issue already has an open `approve_plan` approval,
     call `POST /api/approvals/{id}/request-revision` to take the
     plan back into drafting, then `POST /api/approvals/{id}/resubmit`
     with your `softwareArchitect` section filled in and your
     proposed stories appended. If no plan exists yet, call
     `POST /api/issues/{parentId}/plans` with an initial payload.
     Stories are only created once the operator approves the plan
     and `POST /api/approvals/{id}/materialize` runs.
  5. Move the parent issue to `in_review`.

## 5. Review pass

Even if no reviews are assigned, scan for PRs touching structural
surfaces (interfaces in `packages/shared/`, route shapes in
`server/src/routes/`, plugin SDK):

- If you spot a structural concern on an Engineer PR, leave a review
  comment. Keep it high-signal — structural only, not style.

## 6. Update the task

- Status transitions: `in_progress` during drafting, `in_review` once
  the ADR is up and review requested, `done` when the review is
  signed off and subtasks are filed.
- Comment concisely: the decision, the trade-off, the link.

## 7. Fact extraction

- Durable architectural decisions → `./life/decisions/`.
- Timeline: `./memory/YYYY-MM-DD.md`.

## 8. Exit

- Comment on anything `in_progress` you touched.
- If your review queue is empty and no tasks are actionable, exit.

## Rules

- Always include `X-Softclip-Run-Id` on mutating API calls.
- Never merge a PR yourself — that's Engineer's responsibility.
- Never skip the trade-offs section, even if you're confident.
