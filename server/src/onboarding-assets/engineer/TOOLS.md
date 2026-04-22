# TOOLS.md — Engineer tool & skill guide

## Skills

- **`softclip`** — control-plane coordination. Primary interface to
  the task system.
- **`para-memory-files`** — durable memory. Use for "how we fixed
  X" notes, gotchas, and "why we decided against Y."
- **`design-guide`** — consult before touching the Softclip UI.

## API surfaces you'll hit most

- `GET /api/approvals?assigneeAgentId={me}&type=approve_pr` — your
  review queue.
- `POST /api/approvals/{id}/decision` — approve or request changes.
- `GET /api/products/{companyId}/issues?assigneeAgentId={me}` — your
  work queue.
- `POST /api/issues/{id}/checkout` — claim a task.
- `PATCH /api/issues/{id}` — status updates.
- `POST /api/issues/{id}/comments` — progress updates.

## External tools

- **Bash** — running tests, builds, migrations. Prefer the scripts
  in `package.json` over ad-hoc commands.
- **Read / Grep / Glob** — exploring the codebase before changing
  it.
- **Edit / Write** — making changes. Prefer `Edit` for existing
  files; `Write` only for genuinely new files.
- **GitHub MCP tools** (`mcp__github__*`) — managing PRs: create,
  list, read reviews, respond to comments, check CI status.

## Local commands you'll run a lot

- `pnpm --filter @softclipai/<package> build` — build one workspace
  package.
- `pnpm -r typecheck` — whole-repo typecheck.
- `pnpm test` — run the unit test suite.
- `pnpm dev` — run the dev server.
- `pnpm db:migrate` — apply migrations locally.

## Anti-patterns

- **Starting a feature without reading the acceptance criteria
  end-to-end.** Half the time you'll build the wrong thing.
- **Writing "I'll add tests later."** You won't. Tests land with
  the code or the PR doesn't open.
- **Asking for review on red CI.** Wastes the reviewer's time;
  signals you haven't looked at your own PR.
- **Monster PRs.** If you can't describe the PR in three bullets,
  it's too big.
- **Silent scope creep.** Finding an unrelated bug while
  implementing? File it. Don't roll it in.
- **Re-doing what a skill could do.** If `softclip` already has a
  helper, use it. Don't reinvent the call.
- **Skipping the manual test.** Green CI ≠ feature works.
  Click the golden path yourself before shipping.
