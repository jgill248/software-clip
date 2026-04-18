# HEARTBEAT.md — Engineer checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`,
  `PAPERCLIP_WAKE_COMMENT_ID`, `PAPERCLIP_APPROVAL_ID`.

## 2. Review queue

Unblock other engineers before starting new work.

- `GET /api/approvals?assigneeAgentId={me}&type=approve_pr` — PRs
  waiting on your review.
- For each: review, approve, or request changes with specifics.

## 3. Read comments on open PRs

If you have open PRs with review comments:

- `GET /api/issues/{id}/comments` for each in-flight issue, and
  `mcp__github__get_pull_request_reviews` for the linked PR.
- Respond to every comment: fix, explain, or push back with a
  reason.

## 4. Queue triage

- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress,in_review,blocked`.
- Prioritize:
  1. `in_progress` you were mid-implementation on.
  2. `in_review` with new comments.
  3. `todo` from the current sprint.
- Skip `blocked` unless you can unblock yourself.

## 5. Checkout and work

- `POST /api/issues/{id}/checkout` to claim the issue.
- For each implementation issue:
  1. Read acceptance criteria and any linked design / ADR.
  2. If any criterion is ambiguous, comment on the issue and stop.
  3. Branch: `<role>/<short-slug>-<issue-id>`.
  4. Implement. Keep the change focused on the acceptance criteria.
  5. Write tests alongside the code. New feature: new test. Bug:
     regression test.
  6. Run the local test + typecheck before opening the PR.
  7. Open the PR. Description links the issue, summarizes the
     change, lists manual test steps.
  8. Wait for CI green. If CI fails, fix before asking for review.
  9. Request `approve_pr` from the reviewer. Add architecture /
     data / design review requests if the change touches those
     surfaces.
  10. Move the issue to `in_review`.

## 6. Merge pass

For your own PRs that are approved + green:

- Double-check acceptance criteria and DoD checklist.
- Merge.
- Update `CHANGELOG.md` if user-visible.
- Close the issue (`status=done`) with a comment linking the
  merged commit.

## 7. Update the task

- Comment in concise markdown: what you did, what's left, links.
- Use `PATCH /api/issues/{id}` for status changes; use
  `POST /api/issues/{id}/comments` for context.

## 8. Fact extraction

- Durable engineering notes → `./life/engineering/`. "We tried X
  and it didn't work because Y" is gold.
- Timeline: `./memory/YYYY-MM-DD.md`.

## 9. Exit

- Comment on any `in_progress` work.
- Never exit with CI red on your PR without a comment about it.

## Rules

- Always include `X-Paperclip-Run-Id` on mutating API calls.
- Never merge with failing CI.
- Never ship without tests.
- Never retry a 409 on checkout — the task is someone else's.
- Self-assign via checkout only when explicitly @-mentioned.
