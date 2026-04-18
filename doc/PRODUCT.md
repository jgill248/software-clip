# Softclip — Product Definition

> **Transition note.** Softclip is the new name for Paperclip. Code-level
> identifiers (`paperclipai` CLI, `@paperclipai/*` npm packages, `PAPERCLIP_*`
> env vars, the `companies` DB table) still carry the Paperclip name while
> the rename lands incrementally. This document describes Softclip, the
> product.

## What It Is

Softclip is the control plane for autonomous **AI software development
teams**. One instance of Softclip can run multiple **products**. A product
is a first-order object — the team, the roadmap, and the work live
under it.

## Core Concepts

### Product

A product has:

- A **roadmap** — items the team commits to shipping, each rolling up
  individual issues (formerly "goals" in the Paperclip era)
- A **roster** — every team member is an AI agent organised under a
  Product Owner
- An **org chart** — who reports to whom (PO at the root by default)
- **Sprints** — time-boxed iterations with a goal, commitment, and
  burndown
- An **issue tree** — all work traces back to a roadmap item

### Default Roster

When you scaffold a product with `product-creator`, the default team is
a Product Owner + five to seven reports:

| Role                | Reports to    | Primary responsibility                                            |
| ------------------- | ------------- | ----------------------------------------------------------------- |
| Product Owner       | *(root)*      | Roadmap, prioritisation, acceptance criteria                      |
| Software Architect  | Product Owner | Code structure, API contracts, refactor proposals                 |
| Solution Architect  | Product Owner | Integrations, deployment topology, cross-service contracts       |
| Data Architect      | Product Owner | Schema, migrations, indexing, PII                                 |
| Designer            | Product Owner | Flows, wireframes, design-system, a11y                            |
| Engineer            | Product Owner | Implements, writes tests, opens PRs                               |
| QA                  | Product Owner | Test plans, regression tests, DoD sign-off                        |

Each role ships with a five-file instruction bundle: `README.md` (for
humans), `AGENTS.md` (role + delegation), `HEARTBEAT.md` (step-by-step
checklist), `SOUL.md` (decision posture), `TOOLS.md` (which tools to
reach for).

### Sprint

A **sprint** is a time-bound iteration with a state machine:

```
planned → active → closed
```

Forward-only transitions. Only one sprint per product can be `active`
at a time (enforced by a partial unique index). Issues optionally carry
a `sprintId` so they can live in, or outside, the current iteration.

Burndown: `GET /api/sprints/:id/summary` returns per-status counts.

### Issue

Issues are the unit of work. Every issue has:

- A title, description, status, priority, issue type
  (`feature | bug | tech_debt | spike | chore`)
- An assignee (one agent at a time)
- A parent issue (creating a traceable hierarchy back to a roadmap item)
- An optional `sprintId`
- An **acceptance-criteria checklist** (see below)
- A `definitionOfDoneMet` flag flipped only when the close-guard passes

Status lifecycle:

```
backlog → todo → in_progress → in_review → done
                       ↓
                    blocked
```

Terminal: `done`, `cancelled`. Closing requires an **atomic checkout** —
only one agent owns a task at a time.

### Acceptance Criteria & Definition of Done

Every issue can carry a checklist of testable acceptance criteria. Each
criterion has status `pending | met | waived`. Waiving requires a
non-empty reason.

The issues service enforces a **close-guard**: transitioning to `done`
is refused if any criterion is still `pending`. The guard runs inside
the close transaction to prevent TOCTOU with concurrent criterion
edits.

### Reviews (Approvals, reframed)

The generic approvals primitive handles dev-team review gates:

- `approve_pr` — code review for a specific PR
- `approve_design` — design review
- `approve_architecture` — architecture / ADR review
- `approve_po_strategy` — roadmap / direction approval (formerly
  `approve_ceo_strategy`, retained as alias for back-compat)

`POST /api/issues/:issueId/reviews { reviewType, payload }` is the
convenience wrapper that creates a review, links it to the issue, and
validates the payload per type — all in one call.

### Ceremonies

Five dev-team ceremonies ship as authored routine templates and can be
seeded into any product:

- Daily standup
- Sprint planning
- Sprint review
- Retrospective
- Backlog grooming

Each template's description is the agent-facing prompt: concrete steps,
expected output, where to publish results. Seeding is idempotent and
optionally assigns them to the PO so they land `active` rather than
draft.

### Agent Execution

Two fundamental modes for running an agent's heartbeat:

1. **Run a command** — Softclip kicks off a process (shell command,
   Python script, etc.) and tracks it. The heartbeat is "execute this
   and monitor it."
2. **Fire and forget a request** — Softclip sends a webhook/API call to
   an externally running agent. The heartbeat is "notify this agent to
   wake up." (OpenClaw hooks work this way.)

Sensible defaults are provided — a default adapter that shells out to
Claude Code or Codex with your configuration, remembers session IDs,
runs basic scripts. But you can plug in anything that responds to a
heartbeat.

### Task Hierarchy

Task management is hierarchical. At any moment, every piece of work
must trace back to a roadmap item through a chain of parent tasks:

```
I am writing the CSV export serialiser (current issue)
  because → I need to ship "Users can export their notes as CSV" (parent)
    because → This is in the v1 Data Portability roadmap item
      because → v1 launch
```

Issues have parentage. Every issue exists in service of a parent
issue, all the way up to a roadmap item. This is what keeps autonomous
agents aligned — they can always answer "why am I building this?"

## Principles

1. **Unopinionated about how you run your agents.** Your agents could
   be OpenClaw bots, Python scripts, Node scripts, Claude Code
   sessions, Codex instances — Softclip doesn't care. Softclip defines
   the control plane for communication and provides utility
   infrastructure for heartbeats. It does not mandate an agent
   runtime.

2. **Product is the unit of organisation.** Everything lives under a
   product. One Softclip instance, many products.

3. **Adapter config defines the agent.** Every agent has an adapter
   type and configuration that controls its identity and behaviour.
   The minimum contract is just "be callable."

4. **All work traces to a roadmap item.** Hierarchical task management
   means nothing exists in isolation. If you can't explain why an
   issue matters to a roadmap item, it shouldn't exist.

5. **Control plane, not execution plane.** Softclip orchestrates.
   Agents run wherever they run and phone home.

6. **Acceptance criteria are authored by the PO, enforced by the
   close-guard.** You can't close an issue while any criterion is
   pending.

7. **Reviews gate closure.** Code, design, and architecture reviews
   are first-class approvals linked to issues.

## User Flow

1. `npx paperclipai onboard` — install locally
2. `paperclipai db connect` — point at a team Postgres (optional; the
   default is an embedded local Postgres)
3. Use the `product-creator` skill to scaffold a new product with the
   default five-to-seven-role dev team, or start from a repo and let
   `from-repo-guide` propose a roster
4. Bootstrap the Product Owner via invite URL
5. `POST /api/companies/:id/ceremonies/seed` — seed standup / planning
   / retro / review / grooming as first-class routines owned by the PO
6. PO defines the roadmap, writes acceptance criteria, commits issues
   to the first sprint
7. Agents start their heartbeats; Engineer implements, QA writes test
   plans, Designer specs flows, Architects review
8. Work closes only when acceptance criteria are met and reviews pass

## Guidelines

Two runtime modes Softclip must support:

- `local_trusted` (default): single-user local trusted deployment with
  no login friction
- `authenticated`: login-required mode that supports both private-
  network and public deployment exposure policies

Canonical mode design and command expectations live in
`doc/DEPLOYMENT-MODES.md`.

## Further Detail

See [SPEC.md](./SPEC.md) for the technical specification and
[TASKS.md](./TASKS.md) for the task management data model.

---

## What Softclip should do vs. not do

**Do**

- Stay at the **team level**. Users should manage the roadmap, the
  sprint, the acceptance criteria, the reviews — not individual
  bytes.
- Make the first five minutes feel magical: scaffold a team, seed
  ceremonies, see a PO actually prioritise.
- Keep work anchored to **issues / sprints / roadmap items**, even if
  the surface feels conversational.
- Make **reviews first-class**: code, design, architecture all gate
  closure through the same primitive.
- Make **acceptance criteria testable and enforced**: the close-guard
  is the mechanism.
- Provide **hooks into engineering workflows**: worktrees, preview
  servers, PR links, external review tools.
- Use **plugins** for edge cases like rich chat, knowledge bases, doc
  editors, custom tracing.

**Do not**

- Do not make the core product a general chat app. Softclip is
  task/comment-centric and "not a chatbot."
- Do not build a complete Jira/Linear replacement. Softclip is
  narrower and opinionated for AI dev teams.
- Do not build enterprise-grade RBAC first. Multi-human governance is
  coarse and product-scoped.
- Do not lead with raw bash logs and transcripts. Default view is
  human-readable intent/progress.
- Do not force users to understand provider / API-key plumbing unless
  absolutely necessary.
- Do not impose dollar-budget governance. Dev teams don't run on
  monthly dollar budgets; that's business vocabulary. Token-level
  observability is fine; budget-enforcement governance is out.

## Specific design goals

1. **Time-to-first-sprint under 10 minutes**
   A fresh user should go from install to "my PO just planned a sprint
   the engineer is working on" in one sitting.

2. **Team-level abstraction always wins**
   The default UI should answer: what is the team shipping, who is
   doing it, why does it matter, what's gated on review or
   acceptance criteria.

3. **Conversation stays attached to work objects**
   "Chat with the PO" should resolve to roadmap threads, acceptance
   criteria, reviews, or sprint commits.

4. **Progressive disclosure**
   Top layer: human-readable summary. Middle layer:
   checklist/steps/artifacts. Bottom layer: raw logs/tool
   calls/transcript.

5. **Output-first**
   Work is not done until the user can see the result: merged PR,
   file, document, preview link, screenshot, test report.

6. **Local-first, team-Postgres-ready**
   The mental model should not change between local solo use and
   shared team Postgres on a server.

7. **Safe autonomy**
   Auto mode is allowed; hidden token burn is not. Acceptance criteria
   and reviews are the guard-rails.

8. **Thin core, rich edges**
   Put optional chat, knowledge, and special surfaces into
   plugins/extensions rather than bloating the control plane.
