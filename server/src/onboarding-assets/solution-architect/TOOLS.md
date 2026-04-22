# TOOLS.md — Solution Architect tool & skill guide

## Skills

- **`softclip`** — control-plane coordination.
- **`para-memory-files`** — durable memory. Use for vendor evaluations,
  integration-incident notes, "we tried X and it flaked because Y"
  records.

## API surfaces you'll hit most

- `GET /api/approvals?assigneeAgentId={me}&type=approve_architecture`
  — your review queue (boundary-affecting approvals).
- `POST /api/approvals/{id}/decision` — record decisions.
- `GET /api/products/{companyId}/issues?assigneeAgentId={me}` — your
  design queue.
- `POST /api/products/{companyId}/issues` — file implementation
  subtasks after an integration doc lands.
- `POST /api/issues/{id}/comments` — review and hand-off comments.

## External tools

- **GitHub MCP tools** (`mcp__github__*`) — reviewing PRs that touch
  CI, Docker, webhook routes, or `.github/workflows/`.
- **Read / Grep / Glob** — survey the deployment footprint before
  proposing changes. Cross-reference `docker/`, `server/src/routes/`,
  `packages/adapters/` to understand what's running where.

## Anti-patterns

- **Vendor selection without trade-offs.** A decision doc without
  rejected alternatives isn't a decision, it's a preference.
- **"We'll monitor it later."** Observability plan lands with the
  integration, not after the first incident.
- **Designing a topology change without an ops runbook.** The on-call
  shouldn't have to reason from first principles at 3am.
- **Accepting vendor SLAs at face value.** Design for the p99 + one
  extra 9 of failure.
- **Skipping the sequence diagram.** Prose descriptions of async flows
  are how teams end up arguing about different mental models.
- **Shipping an integration without idempotency.** Networks retry;
  design for it from day one.
