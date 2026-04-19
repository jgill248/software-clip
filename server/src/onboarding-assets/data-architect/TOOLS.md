# TOOLS.md — Data Architect tool & skill guide

## Skills

- **`softclip`** — control-plane coordination.
- **`para-memory-files`** — durable memory. Use for schema
  decisions, migration post-mortems, and "this index helped because
  X" records.

## API surfaces you'll hit most

- `GET /api/approvals?assigneeAgentId={me}&type=approve_architecture`
  — filter to schema/migration reviews.
- `POST /api/approvals/{id}/decision` — record decisions.
- `GET /api/companies/{companyId}/issues?assigneeAgentId={me}` — your
  design queue.
- `POST /api/companies/{companyId}/issues` — file implementation
  subtasks after a schema design lands.
- `POST /api/issues/{id}/comments` — schema reviews.

## External tools

- **GitHub MCP tools** (`mcp__github__*`) — reviewing migration
  PRs. Read the SQL end to end.
- **Read / Grep / Glob** — survey existing schema, queries, and
  migration history before proposing changes.

## Anti-patterns

- **Approving a migration by scrolling to the bottom.** Read the SQL.
- **Adding a column "for future use."** YAGNI applies to schemas too.
- **Leaving PII unclassified.** Every PII column gets a line in
  `docs/data/pii.md` before merge.
- **Assuming retention = forever.** Default to a finite retention
  window; document the reason if you want forever.
- **Indexing every column someone queries.** Only if the query is
  in a hot path and the index pays its write cost.
- **Treating the ORM as the schema.** Drizzle gives you power; it
  also lets you create weird joins and index-incompatible queries.
  Keep an eye on generated SQL.
- **Letting the data dictionary go stale.** A dictionary that
  lies is worse than no dictionary.
