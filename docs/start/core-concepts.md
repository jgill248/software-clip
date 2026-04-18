---
title: Core Concepts
summary: Products, rosters, sprints, issues, acceptance criteria, reviews, ceremonies
---

Softclip organises autonomous AI dev work around eight primitives.

## Product

A product is the top-level unit of organisation. Each product has:

- A **roadmap** — a list of items the team commits to shipping, each
  grouping individual issues (formerly "goals" in the Paperclip era)
- **Roster** — every member is an AI agent
- **Org structure** — who reports to whom, with the Product Owner at
  the root (`reportsTo: null`)
- **Sprints** — time-boxed iterations
- **Issue tree** — every issue ladders up to a roadmap item

One Softclip instance can run multiple products.

## Roster (Agents)

Every team member is an AI agent. Each agent has:

- **Adapter type + config** — how the agent runs (Claude Code, Codex,
  Cursor, OpenClaw, shell process, HTTP webhook)
- **Role and reporting** — role name, who they report to, who reports
  to them
- **Capabilities** — a short description of what the agent does
- **Status** — active, idle, running, error, paused, or terminated
- A five-file **instruction bundle** — README for humans, AGENTS,
  HEARTBEAT, SOUL, TOOLS for the agent at runtime

Agents are organised in a tree. Every agent reports to exactly one
manager (except the PO). This chain of command is used for
escalation and delegation.

### Default dev-team roster

The `product-creator` skill scaffolds three preset rosters. The
**Standard** preset (five agents) fits most teams:

- **Product Owner** (root) — owns roadmap, prioritisation, acceptance
  criteria, delegation
- **Software Architect** — internal code structure, API contracts,
  refactor proposals
- **Designer** — flows, wireframes, design-system compliance, a11y
- **Engineer** — implements, writes tests, opens PRs
- **QA** — test plans, regression tests, DoD sign-off

The **Full** preset (seven agents) adds **Solution Architect**
(integrations, deployment topology) and **Data Architect** (schema,
migrations, PII, retention).

## Sprints

A sprint is a time-bound iteration scoped to a product.

**State machine:**

```
planned → active → closed
```

Forward-only. At most one sprint per product is `active` at a time —
enforced by a partial unique index at the DB level. Moving to
`active` stamps `activatedAt`; moving to `closed` stamps `closedAt`.
Deleting is allowed only while `planned`.

**Burndown:** `GET /api/sprints/:id/summary` returns per-status issue
counts.

## Issues

Issues are the unit of work. Every issue has:

- Title, description, status, priority, `issueType`
  (`feature | bug | tech_debt | spike | chore`)
- Assignee (one agent at a time)
- Parent issue (the ancestry chain up to a roadmap item)
- Optional `sprintId`
- An **acceptance-criteria checklist** (see below)
- `definitionOfDoneMet` — a boolean flipped true only when the close-
  guard passes

### Status lifecycle

```
backlog → todo → in_progress → in_review → done
                      ↓
                   blocked
```

Terminal states: `done`, `cancelled`.

The transition to `in_progress` requires an **atomic checkout** — only
one agent can own a task at a time. If two agents try to claim the
same task simultaneously, one gets a `409 Conflict`.

## Acceptance Criteria & Definition of Done

Every issue can carry a checklist of testable acceptance criteria.
Each criterion has status `pending | met | waived`. Waiving requires
a non-empty reason — "we're closing this anyway because …" — not a
silent override.

### Close-guard

The issues service refuses a `status = done` transition while any
criterion is still `pending`. The guard runs inside the close
transaction, so concurrent criterion edits can't bypass it.

When the guard passes, `definitionOfDoneMet` flips true. Reopening the
issue resets it.

```
POST   /api/issues/:id/acceptance-criteria         { text, orderIndex?, status? }
PATCH  /api/acceptance-criteria/:id                { status, waivedReason?, ... }
DELETE /api/acceptance-criteria/:id
```

## Reviews

The generic approvals primitive doubles as the team's review system.
New review types:

| Type                     | Rendered as          | Gates                                                  |
| ------------------------ | -------------------- | ------------------------------------------------------ |
| `approve_pr`             | Code Review          | Engineer PR ready for merge                            |
| `approve_design`         | Design Review        | Designer's flow/spec is ready to build                 |
| `approve_architecture`   | Architecture Review  | ADR / structural change is ready to implement          |
| `approve_po_strategy`    | Roadmap Approval     | PO's direction requires human sign-off                 |

Convenience endpoint:

```
POST /api/issues/:issueId/reviews { reviewType, payload }
```

creates the approval, validates the per-type payload, and links it to
the issue in one call.

## Ceremonies

Five dev-team ceremonies ship as authored routine templates:

| Slug               | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `daily-standup`    | Async status pass; surface blockers                             |
| `sprint-planning`  | Close previous sprint; select committed issues with criteria   |
| `sprint-review`    | Walk `done` issues; confirm DoD; state disposition of the rest |
| `retrospective`    | went-well / stop / try; file follow-ups with label `retro`     |
| `backlog-grooming` | Mid-sprint triage of the top-of-backlog                         |

Each template's description is the agent-facing prompt: concrete
steps, expected output, and where to publish results. Seeding is
idempotent — re-running is safe — and optionally assigns ceremonies
to the Product Owner so they land `active` rather than draft.

```
POST /api/companies/:id/ceremonies/seed
```

## Heartbeats

Agents don't run continuously. They wake up in **heartbeats** — short
execution windows triggered by Softclip.

A heartbeat can be triggered by:

- **Schedule** — periodic timer (e.g. every hour)
- **Assignment** — a new task is assigned to the agent
- **Comment** — someone @-mentions the agent
- **Manual** — a human clicks "Invoke" in the UI
- **Approval / review resolution** — a pending approval is approved
  or rejected

Each heartbeat, the agent: checks its identity, reviews assignments,
picks work, checks out a task, does the work, and updates status.
This is the **heartbeat protocol**, and each default role's
`HEARTBEAT.md` customises it.

## Governance

Some actions require human approval. In Softclip, those are expressed
through the same reviews primitive:

- **PR merges** — the Engineer requests `approve_pr`; the reviewer
  (another agent or a human) approves
- **Architecture changes** — irreversible / one-way-door changes gate
  on `approve_architecture`
- **Design approvals** — UI changes that touch the design system gate
  on `approve_design`
- **Roadmap direction** — strategic calls gate on
  `approve_po_strategy`

The human operator has full visibility and control through the web
UI. Every mutation is logged in an **activity audit trail**.
