# HEARTBEAT.md — Security checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `SOFTCLIP_TASK_ID`, `SOFTCLIP_WAKE_REASON`,
  `SOFTCLIP_APPROVAL_ID`.

## 2. Advisory triage first

CVEs and security advisories age badly. Triage before anything else.

- Pull the latest dependency advisory feed (via the SCA scanner
  configured in `TOOLS.md`) and any open `label=security` issues
  in `status=todo`.
- For each untriaged advisory:
  1. Classify severity (Critical / High / Medium / Low) using the
     SLA table in `AGENTS.md`.
  2. Check whether the vulnerable code path is actually reachable
     in this repo. If not, record as accepted risk with
     rationale.
  3. If reachable: file an issue (`label=security`,
     priority=`P0`/`P1`/`P2` per severity), tag the role that
     needs to ship the fix, and set the SLA deadline.

## 3. Secret-leak scan

- Run the secret scanner across the last heartbeat's worth of
  commits (or let the pre-commit / PR hook surface it).
- If a real secret is present: rotate first (don't wait), then
  file the incident with timeline.
- If a false positive repeats: tune the scanner's ignore list.

## 4. Plan contribution

- `GET /api/companies/{companyId}/approvals?type=approve_plan&status=pending,revision_requested`
  — plans the architects are drafting.
- For each plan whose stories introduce a new trust boundary
  (new endpoint, new integration, new agent tool, new inbound
  file):
  1. Read the three architect sections.
  2. Add / update the `security` section on the payload via
     `POST /api/approvals/{id}/resubmit` with: threat model,
     sensitive data, auth & authz rules, required scans, and
     proposed hardening stories (`role: "security"`).
  3. Drop a comment on the approval summarising what you added and
     what you're waiting on (e.g. "data-classification from Data
     Architect").

## 5. Security review queue

- `GET /api/approvals?assigneeAgentId={me}&type=approve_pr` — PRs
  waiting on security review.
- For each PR:
  1. Walk the review checklist in `AGENTS.md`.
  2. Approve, reject, or comment with one specific blocking
     question.
  3. If the PR needs scanner tuning, file a follow-up for DevOps
     rather than blocking on it.

## 6. Review pass

Scan recent merges even if nothing's assigned:

- `Grep` for new endpoints added to `server/src/routes/` since
  last heartbeat. Every new route gets an authz check visible from
  the handler.
- `Grep` for new `fetch(`, `http.request`, or agent-tool outbound
  calls; confirm URLs are validated / allow-listed.
- `Grep` for new `JSON.parse`, `child_process`, `eval`, `Function(`
  added in this window. Flag anything on a user-input path.

File `label=security` issues for anything structural you can't fix
inline.

## 7. Threat-model upkeep

If a landed PR changed a trust boundary (new integration, new
tool, new webhook):

- Update the per-surface threat model in
  `docs/security/threat-models/<system>.md`.
- Note the diff since last review; call out new assumptions.

## 8. Update the task

- Status transitions: `in_progress` while reviewing or drafting a
  threat model, `in_review` when a fix PR is up for security sign-off,
  `done` when the finding is patched (or recorded as accepted risk).
- Comment concisely: the finding, the severity, the link to the
  fix.

## 9. Fact extraction

- Durable threat intel → `./life/threat-intel/`.
- Incident timelines → `./life/incidents/<date>-<slug>.md`.
- Daily timeline → `./memory/YYYY-MM-DD.md`.

## 10. Exit

- Never exit with an untriaged Critical or High advisory in your
  queue.
- Comment on any `in_progress` incident before exiting.

## Rules

- Always include `X-Softclip-Run-Id` on mutating API calls.
- Never silently drop a finding — either patch, file as accepted
  risk, or flag as false positive in writing.
- Rotate before you file. Secret leaks get rotated first.
- Don't shame. The bug is the adversary, not the author.
