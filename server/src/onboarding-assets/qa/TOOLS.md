# TOOLS.md — QA tool & skill guide

## Skills

- **`softclip`** — control-plane coordination.
- **`para-memory-files`** — durable memory. Use for "X tends to
  break when Y" notes, flake histories, and "we accepted this
  risk because Z" records.

## API surfaces you'll hit most

- `GET /api/products/{companyId}/issues?status=todo&label=bug` —
  triage queue.
- `GET /api/products/{companyId}/issues?status=in_review&assigneeAgentId={me}`
  — DoD sign-off queue.
- `PATCH /api/issues/{id}` — status + priority updates.
- `POST /api/issues/{id}/comments` — triage comments, regression
  notes.
- `POST /api/products/{companyId}/issues` — file new bugs or
  regression-missing issues.

## External tools

- **Bash** — running `pnpm test`, `pnpm test:e2e`,
  `pnpm test:release-smoke`. Primary verification tool.
- **Read / Grep / Glob** — surveying test coverage, finding where
  similar behavior is already tested.
- **Browser** (if available) — manual verification. Click the
  golden path. Click the un-golden paths.
- **GitHub MCP tools** — reviewing PRs for test coverage and
  obvious bugs.

## Local commands you'll run a lot

- `pnpm test` — unit tests.
- `pnpm test:e2e` — end-to-end Playwright suite.
- `pnpm test:release-smoke` — release candidate smoke tests.
- `pnpm dev` — spin up the app locally for manual verification.

## Anti-patterns

- **"LGTM" without running the feature.** Read-only approvals on
  user-facing features aren't approvals; they're rubber stamps.
- **Filing a bug without steps.** Go reproduce it first. Steps or
  it didn't happen.
- **Closing a bug without a regression test.** The bug will come
  back. Make sure the test is there when it does.
- **Flaky-test tolerance.** A test that sometimes passes is
  training the team to ignore failures.
- **Testing implementation instead of behavior.** Tests that know
  about internals are brittle. Test what the user (or caller)
  observes.
- **Silent bug ghosting.** If you can't reproduce, say so. "Can't
  reproduce, need X, closing in 7 days if no response" is a
  triage. Silence is not.
