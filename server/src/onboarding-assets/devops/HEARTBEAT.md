# HEARTBEAT.md — DevOps checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `SOFTCLIP_TASK_ID`, `SOFTCLIP_WAKE_REASON`,
  `SOFTCLIP_APPROVAL_ID`.

## 2. CI health first

Red main blocks the entire team. Clear this before anything else.

- Check the status of the last main-branch pipeline (via
  `mcp__github__list_commits` or the CI UI).
- If main is red:
  1. Identify the responsible commit.
  2. Revert if the fix is more than a one-liner. Revert now, fix
     forward later.
  3. Open a `priority=critical` issue naming the broken workflow,
     the suspected cause, and the plan.
- If main is green: check flake rate across the last 20 pipeline
  runs. Flaky tests get a `label=flake` issue and a
  quarantine within the same heartbeat.

## 3. Alert triage

- Pull any active alerts from the monitoring surface configured
  in `TOOLS.md`.
- For each fired-but-unacknowledged alert:
  1. Ack.
  2. Follow the named runbook.
  3. If the alert is noisy (firing without a real incident),
     file an issue to tune the threshold — don't silence.
- For any active incident (`status=in_progress`, `label=incident`):
  comment the current status, next action, and ETA. Visible
  progress beats hidden heroics.

## 4. Plan contribution

- `GET /api/companies/{companyId}/approvals?type=approve_plan&status=pending,revision_requested`
  — plans the architects are drafting.
- For each plan whose stories touch deploy topology, new
  dependencies, new runtime concerns, or new observability
  surfaces:
  1. Read the three architect sections + the security section.
  2. Add / update the `devops` section on the payload via
     `POST /api/approvals/{id}/resubmit` with: deploy impact, CI
     impact, observability needs, rollback plan, capacity,
     proposed devops stories.
  3. Comment on the approval summarising what you added.
- For plans with no infra impact: comment "no devops impact" and
  move on.

## 5. Release queue

If a release is in flight:

- `GET /api/companies/{companyId}/issues?label=release&status=in_progress`.
- Walk the release checklist in `AGENTS.md`. Gate on each step
  explicitly — don't ship past an unchecked box.
- Post a status comment on the release issue with: candidate
  tag, smoke-test result, security sign-off state, canary
  dashboard link, decision.

## 6. Pipeline & infra work

- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress,in_review,blocked`
  — your queue.
- For each CI / infra issue:
  1. Draft the change in IaC (Terraform plan / Helm diff /
     workflow diff).
  2. Open the PR with the plan output attached to the description.
  3. Request `approve_architecture` from the Solution Architect
     if it affects deploy topology.
- Never merge infra changes without a rollback plan in the PR
  description.

## 7. Runbook upkeep

If an alert fired this heartbeat and its runbook didn't help, or
if a new alert was added:

- Update the runbook. Note the diff at the bottom with a date.
- If multiple alerts share a root cause, collapse their runbooks
  into one and cross-link.

## 8. Capacity / cost spot-check

- Compare current period cost to the previous period at the same
  point in the cycle.
- If cost is > 2× baseline or an unexplained line item appears,
  file a `P1` with graphs before moving on.

## 9. Update the task

- Status transitions: `in_progress` while drafting IaC, `in_review`
  when the infra PR is up, `done` when it's merged and the
  deployed state matches.

## 10. Fact extraction

- Durable ops lore → `./life/runbooks/` (alert-name keyed).
- Incident post-mortems → `./life/incidents/<date>-<slug>.md`.
- Daily timeline → `./memory/YYYY-MM-DD.md`.

## 11. Exit

- Never exit with red main, an unacknowledged SEV-1, or a
  release candidate stuck without a verdict.
- Comment on any `in_progress` pipeline / release work before
  exiting.

## Rules

- Always include `X-Softclip-Run-Id` on mutating API calls.
- Never silence an alert without a runbook update.
- Revert first, debug later for red main.
- Every infra PR has a rollback plan in the description.
- Automate once — if you did the same fix twice, the third gets a
  script.
