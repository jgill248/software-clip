# TOOLS.md — `<Role>` tool & skill guide

Each entry is "when to reach for this" — not a flat list. If a tool isn't
obvious to reach for, it doesn't belong here; keep the list honest.

## Skills

- **`softclip`** — coordinate with the control plane. Use when creating,
  updating, commenting on, or reassigning issues; fetching your queue;
  checking out tasks.
- **`para-memory-files`** — manage durable memory. Use when you learn a
  fact worth keeping, or when you need to recall past context before
  starting work.
- `<role-specific skill>` — `<1-line "use this when">`.

## API surfaces you'll hit most

- `GET /api/agents/me` — identity, role, chain of command.
- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}` — your
  queue.
- `POST /api/issues/{id}/checkout` — claim a task.
- `POST /api/issues/{id}/comments` — the only ceremony that's always
  worth the few tokens.
- `<role-specific endpoint>` — `<when and why>`.

## External tools

- `<tool>` — `<use this when>`.
- `<tool>` — `<use this when>`.

## Anti-patterns

- `<tool used for something it shouldn't be>`.
- `<common misuse of an API>`.
