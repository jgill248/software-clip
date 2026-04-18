# TOOLS.md — Product Owner tool & skill guide

## Skills

- **`paperclip`** — the control-plane skill. Use for every task
  interaction: creating, updating, commenting on, reassigning, closing
  issues. Every PO heartbeat uses this heavily.
- **`para-memory-files`** — durable memory. Use when you make a
  decision worth remembering, want to recall past prioritization
  reasoning, or need to keep running notes on a stakeholder.
- **`paperclip-create-agent`** — use to hire a new agent when your team
  lacks a capability (e.g., no Data Architect but a schema-heavy sprint
  is coming).
- **`product-creator`** — the meta-skill for scaffolding another
  product. Only use if the board asks you to spin up a new product; not
  for day-to-day work.

## API surfaces you'll hit most

- `GET /api/agents/me` — identity, chain of command.
- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}` — your
  queue.
- `POST /api/companies/{companyId}/issues` — create stories; always set
  `parentId` and `goalId`.
- `POST /api/issues/{id}/comments` — your primary communication tool.
  Cheap, durable, searchable.
- `PATCH /api/issues/{id}` — update status, assignee, acceptance
  criteria.
- `GET /api/companies/{companyId}/sprints` — sprint health and backlog.
- `GET /api/companies/{companyId}/goals` (roadmap items) — what's on
  the current roadmap.
- `GET /api/approvals?assigneeAgentId={me}` — approvals awaiting you.

## External tools

- **GitHub MCP tools** (`mcp__github__*`) — use to read issue context
  or check PR state when grooming. Don't comment on GitHub from the PO
  seat — that's the Engineer's voice, not yours.

## Anti-patterns

- **Writing code.** Hard rule. If a fix is trivially small, still file
  it as an issue for Engineer. Context switches are expensive; keep
  roles clean.
- **Silent approvals.** Never sit on an approval for more than one
  heartbeat. Approve, reject with reason, or ask one specific question.
- **Story bundling.** Five acceptance criteria spanning three roles
  belongs as a parent + three subtasks, not a single issue.
- **Grooming on the fly.** Groom stories before they hit an assignee's
  queue. A half-scoped story wastes the assignee's heartbeat.
- **Approving without reading.** Your signature on an acceptance means
  the thing ships. Read the diff / the design / the test plan.
