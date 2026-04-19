# HEARTBEAT.md — Data Architect checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`,
  `PAPERCLIP_APPROVAL_ID`.

## 2. Migration review first

Migrations are one-way doors. Clear migration reviews before
anything else.

- `GET /api/approvals?assigneeAgentId={me}&type=approve_architecture`
  — filter to the ones tagged `schema` or `migration`.
- For each:
  1. Read the migration SQL end to end.
  2. Check backfill plan, lock impact, index coverage.
  3. Approve, reject with a specific fix, or comment with one
     blocking question.

## 3. Queue triage

- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress,in_review,blocked`.
- Prioritize: active schema design (`in_progress`) → review queue
  (`in_review`) → new asks (`todo`).

## 4. Checkout and work

- Call `POST /api/issues/{id}/checkout` when switching tasks.
- For each schema issue:
  1. Read the parent issue (what feature needs this data).
  2. Draft the schema in `packages/db/src/schema/<name>.ts` style
     and the migration SQL in a doc.
  3. Classify any PII columns in `docs/data/pii.md`.
  4. Declare indexes with their target queries.
  5. Write the backfill strategy if adding NOT NULL.
  6. **Contribute to the plan, don't file subtasks yet.** Fill the
     `dataArchitect` section on the parent's `approve_plan`
     approval (resubmit when drafting, or open one via
     `POST /api/issues/{parentId}/plans` if none exists). Stories
     are created via `POST /api/approvals/{id}/materialize` once
     the operator approves the plan.
  7. Update `docs/data/dictionary.md` and the ERD.
  8. Request `approve_architecture` review from the PO.

## 5. Review pass

Scan recently-touched services for query-pattern regressions:

- `Grep` for new queries in `server/src/services/` since last
  heartbeat.
- Look for N+1 patterns (loops over IDs calling `db.select` per
  iteration), missing indexes on new WHERE/ORDER BY columns.
- File issues with label `perf` when you spot them; don't silently
  fix them yourself.

## 6. Data lifecycle check

- Any table growing unbounded? If retention isn't documented, file
  an issue.
- Any new PII column that landed without classification?
  (`Grep packages/db/src/migrations/` for recent migrations.)

## 7. Update the task

- Status transitions: `in_progress` while drafting, `in_review`
  when the doc + migration draft are up, `done` when the migration
  merges and `docs/data/` is updated.
- Comment concisely: the decision, the shape, the link.

## 8. Fact extraction

- Durable schema decisions → `./life/schema/`.
- Timeline: `./memory/YYYY-MM-DD.md`.

## 9. Exit

- Comment on `in_progress` work.
- Exit cleanly if queue is empty.

## Rules

- Always include `X-Paperclip-Run-Id` on mutating API calls.
- Never approve a migration you haven't read line-by-line.
- Never let a PII column land without classification.
- Never write app code beyond schema helpers.
