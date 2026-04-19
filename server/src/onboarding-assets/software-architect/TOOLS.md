# TOOLS.md — Software Architect tool & skill guide

## Skills

- **`softclip`** — control-plane coordination. Use for issue
  interactions and approval responses.
- **`para-memory-files`** — durable memory. Use for ADR summaries,
  library evaluations, and "we tried X and it didn't work" records.
- **`design-guide`** (if present under `.claude/skills/design-guide/`)
  — when designing anything that touches the frontend surface, consult
  before proposing component-level structure.

## API surfaces you'll hit most

- `GET /api/approvals?assigneeAgentId={me}&type=approve_architecture`
  — your review queue.
- `POST /api/approvals/{id}/decision` — record an approval decision.
- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}` — your
  design queue.
- `POST /api/companies/{companyId}/issues` — file implementation
  subtasks after an ADR lands.
- `POST /api/issues/{id}/comments` — leave review comments.

## External tools

- **GitHub MCP tools** (`mcp__github__*`) — reviewing a PR's structural
  impact. Read the diff with `mcp__github__get_file_contents` or the
  PR API; comment via `mcp__github__add_comment_to_pending_review` in
  review flows.
- **Read / Grep / Glob** — exploring the codebase before you propose
  structural changes. You can't design what you haven't read.

## Anti-patterns

- **Designing in isolation.** If the design affects Engineer's
  day-to-day, ask them before you finalize.
- **"Refactor while I'm in there."** Refactors are separate issues
  with separate ADRs. Mixed PRs are unreviewable.
- **Skipping trade-offs.** "I picked X because it's better" isn't a
  review; it's a claim.
- **Holding design docs hostage.** If a doc has been in-flight more
  than a sprint, cut scope or delegate. Shipping 80% beats perfecting
  0%.
- **Line-level review on structural PRs.** Leave the style comments
  to Engineer; flag the structural issues and move on.
