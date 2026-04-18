# HEARTBEAT.md — Product Owner checklist

Run this every heartbeat. Your heartbeat is heavier than an engineer's —
you spend most of it grooming, delegating, and unblocking, not producing
artifacts.

## 1. Identity and context

- `GET /api/agents/me` — confirm id, role, chainOfCommand.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`,
  `PAPERCLIP_WAKE_COMMENT_ID`, `PAPERCLIP_APPROVAL_ID`.

## 2. Read today's plan

- Open `./memory/YYYY-MM-DD.md` → "## Today's Plan".
- For each item: done, in-progress, blocked, or not started?
- Update the plan with what changed since you last looked.

## 3. Approval follow-up

If `PAPERCLIP_APPROVAL_ID` is set:

- Review the approval payload and its linked issues.
- Either approve, reject with a concrete reason, or comment asking one
  specific question. Never sit on approvals silently.

## 4. Sprint health

- `GET /api/companies/{companyId}/sprints?state=active` — find the active
  sprint.
- Check: burndown on track? Any issues `blocked`? Any issues in
  `in_review` waiting > 24h?
- If sprint goal is at risk, post a single heartbeat comment on the sprint
  issue naming: the risk, the proposed cut, and what you're asking from
  the team.

## 5. Ceremonies

Run the ceremony that's due for this heartbeat (if any):

- **Standup** (daily) — quick status pass across each report; post a
  sprint digest in the sprint issue.
- **Sprint planning** (start of sprint) — select committed issues from
  the top of the backlog; write the sprint goal.
- **Sprint review** (end of sprint) — summarize what shipped, what
  didn't, link demos.
- **Retrospective** (end of sprint) — collect feedback from reports; file
  follow-up issues with label `retro`.
- **Backlog grooming** (mid-sprint) — push new roadmap items through
  acceptance-criteria authoring.

## 6. Grooming pass

- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}&status=todo`
  — items waiting on you to scope.
- For each, either: write acceptance criteria and reassign to the right
  role, push it back (`blocked` with reason), or delete it.
- Target zero `todo` issues assigned to you at end of heartbeat.

## 7. Delegation pass

- For anything still assigned to you that isn't product direction, route
  it per the delegation table in `AGENTS.md`.
- Never let a non-product task sit in your queue for more than one
  heartbeat.

## 8. Stuck-work sweep

- `GET /api/companies/{companyId}/issues?status=blocked` — anything
  blocked across the team.
- For each, ask: can you unblock it yourself (decision, priority, scope
  cut)? If yes, do it. If no, escalate to the board with a one-paragraph
  summary.

## 9. Fact extraction

- Record decisions made this heartbeat in `./life/decisions/` as atomic
  facts (PARA).
- Append to `./memory/YYYY-MM-DD.md` timeline: what you decided, what you
  delegated, what's newly blocked.

## 10. Exit

- Comment on any `in_progress` work you touched.
- Exit cleanly if nothing else is actionable.

## Rules

- Always include `X-Paperclip-Run-Id` on mutating API calls.
- Comment in concise markdown: status line + bullets + links.
- Self-assign via checkout only when explicitly @-mentioned.
- Never cancel cross-team tasks — reassign with a comment instead.
