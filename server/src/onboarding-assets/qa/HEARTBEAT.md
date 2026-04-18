# HEARTBEAT.md — QA checklist

## 1. Identity and context

- `GET /api/agents/me`.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`,
  `PAPERCLIP_APPROVAL_ID`.

## 2. Triage queue first

Bugs rot if they sit. Triage before anything else.

- `GET /api/companies/{companyId}/issues?status=todo&label=bug`.
- For each untriaged bug:
  1. Try to reproduce using the steps in the issue.
  2. Comment: "Reproduced ✓" / "Can't reproduce — need X" /
     "Reproduced + it's actually a <role> issue, reassigning."
  3. Set priority (`P0`/`P1`/`P2`/`P3`) and reassign to the right
     role.

## 3. DoD sign-off queue

- `GET /api/issues?status=in_review&assigneeAgentId={me}` — issues
  waiting on your DoD sign-off.
- For each:
  1. Pull the branch / run the feature locally.
  2. Walk every acceptance criterion.
  3. Spot-check regressions in neighboring features.
  4. If all checks pass: approve DoD; move issue to `done`.
  5. If anything fails: comment with specifics; move back to
     `in_progress`.

## 4. Test-plan work

- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}&status=todo,in_progress`.
- For each test-plan task:
  1. Read acceptance criteria and the implementation spec.
  2. Draft the test plan (acceptance verification + regression
     scenarios + edge cases + manual vs. automated split).
  3. Hand the automation part to Engineer as a subtask with
     acceptance criteria.
  4. Schedule the manual part on the issue's DoD checklist.

## 5. Regression test authoring

For recently closed bugs without regression tests:

- `GET /api/companies/{companyId}/issues?status=done&label=bug` (last 7 days).
- Cross-check against `tests/e2e/` and unit tests.
- File an issue with label `regression-missing` for any bug that
  closed without a corresponding test.

## 6. Review pass

Scan in-flight PRs for:

- Missing test coverage on new behavior.
- Tests that assert implementation detail instead of behavior.
- Obvious bugs the Engineer missed.

Leave review comments; request changes when coverage is missing.

## 7. Release smoke check (when applicable)

If a release is in flight:

- Run `tests/release-smoke/` against the candidate.
- File issues for any new failures.
- Sign off once smoke is clean.

## 8. Update the task

- `in_progress` while drafting test plans, `in_review` while waiting
  on Engineer for automation, `done` when DoD is signed off.

## 9. Fact extraction

- Durable QA notes → `./life/bugs/` ("X tends to break when Y").
- Timeline: `./memory/YYYY-MM-DD.md`.

## 10. Exit

- Comment on `in_progress` work.
- Never exit with unresolved P0 bugs in your triage queue.

## Rules

- Always include `X-Paperclip-Run-Id` on mutating API calls.
- Never close a bug without a regression test.
- Never sign off DoD without manual verification.
- Triage every inbound bug within one heartbeat.
