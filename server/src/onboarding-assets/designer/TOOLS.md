# TOOLS.md — Designer tool & skill guide

## Skills

- **`softclip`** — control-plane coordination.
- **`para-memory-files`** — durable memory. Use for design-decision
  notes, user-research summaries, rejected-variant records.
- **`design-guide`** — the in-repo design-system skill. Consult
  before speccing any new UI in this codebase. It documents the
  component library, tokens, and status/priority conventions.

## API surfaces you'll hit most

- `GET /api/approvals?assigneeAgentId={me}&type=approve_design` —
  your review queue.
- `POST /api/approvals/{id}/decision` — record decisions.
- `GET /api/products/{companyId}/issues?assigneeAgentId={me}` — your
  design queue.
- `POST /api/products/{companyId}/issues` — file Engineer subtasks.
- `POST /api/issues/{id}/comments` — design reviews and handoff
  notes.

## External tools

- **Read / Grep / Glob** — survey existing `ui/src/components/` to
  see what already exists before you spec something new.
- **GitHub MCP tools** — review UI PRs for design-system compliance
  and a11y.
- **Browser** (if available) — verify the shipped flow after
  Engineer merges.

## Anti-patterns

- **Speccing without edge states.** "Happy path only" designs
  force Engineer to invent the empty/error states and they'll be
  wrong.
- **New components in product features.** New components belong in
  design-system issues, not slipstreamed into product work.
- **"TBD" copy.** If the copy isn't final, the design isn't ready.
- **Approving without running the keyboard-only pass.** Tab through
  the flow. If you can't, a11y is broken.
- **Designing for the edge-case user at the expense of the common
  user.** Design for the median; account for edges; don't invert.
- **Dropping into implementation.** You're not the Engineer. If you
  catch yourself writing JSX, stop and write a handoff instead.
