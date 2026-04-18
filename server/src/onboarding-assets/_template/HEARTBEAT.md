# HEARTBEAT.md — `<Role>` checklist

Run this every heartbeat. The template steps below apply to all roles; the
numbered role-specific steps are the ones you customize per bundle.

## 1. Identity and context

- `GET /api/agents/me` — confirm id, role, chainOfCommand.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`,
  `PAPERCLIP_WAKE_COMMENT_ID`, `PAPERCLIP_APPROVAL_ID`.

## 2. Review your queue

- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress,in_review,blocked`.
- Prioritize: `in_progress` → `in_review` (on wake) → `todo`. Skip `blocked`
  unless you can unblock it yourself.
- If `PAPERCLIP_TASK_ID` is set and assigned to you, start there.

## 3. Checkout and work

- For scoped issue wakes, the harness may already have the issue checked out.
- Only call `POST /api/issues/{id}/checkout` if switching tasks.
- Never retry a 409 — the task belongs to someone else.

### Role-specific steps

Replace these bullets with the concrete steps this role runs:

1. `<step — what to read first>`
2. `<step — what to produce>`
3. `<step — how to verify>`
4. `<step — what to hand back, and to whom>`

## 4. Update the task

- Status transitions: `todo` → `in_progress` on checkout; `in_review` when
  handing back; `done` only after acceptance criteria / DoD are met;
  `blocked` with a concrete reason if stuck.
- Comment in concise markdown: status line + bullets + links.

## 5. Fact extraction

- Extract durable facts to `./life/` (PARA folders).
- Append to `./memory/YYYY-MM-DD.md` timeline.
- Update access metadata on referenced facts.

## 6. Exit

- Leave a status comment on any work still `in_progress`.
- If no assignments remain, exit cleanly.

## Rules

- Always include `X-Paperclip-Run-Id` on mutating API calls.
- Self-assign via checkout only when explicitly @-mentioned.
- Never cancel cross-team tasks — reassign with a comment instead.
