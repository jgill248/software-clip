# Example Dev-Team Package

A minimal but complete package produced by product-creator for a
fictional product called **notekit** — a small web app for capturing
and organising notes. Uses the **Standard** roster (PO + Software
Architect + Designer + Engineer + QA).

This example shows *structure*. The AGENTS.md bodies are abbreviated
for readability — in practice, draw the full bodies from
`server/src/onboarding-assets/<role>/AGENTS.md`.

## Directory layout

```
notekit/
├── COMPANY.md
├── README.md
├── LICENSE
├── agents/
│   ├── product-owner/AGENTS.md
│   ├── software-architect/AGENTS.md
│   ├── designer/AGENTS.md
│   ├── engineer/AGENTS.md
│   └── qa/AGENTS.md
├── teams/
│   └── dev-team/TEAM.md
├── projects/
│   └── v1-launch/PROJECT.md
├── tasks/
│   └── sprint-planning/TASK.md
├── skills/
│   └── release-checklist/SKILL.md
└── .softclip.yaml
```

## COMPANY.md

```markdown
---
name: notekit
description: Small web app for capturing and organising notes, shipped by a five-agent product team.
slug: notekit
schema: agentcompanies/v1
version: 0.1.0
license: MIT
authors:
  - name: Example Dev
goals:
  - Ship a v1 release that a single user can rely on daily
  - Keep the feature set small; optimise for reliability over breadth
tags:
  - software
  - dev-team
  - sprint-driven
---

notekit is a focused web app for personal note-taking. The team runs on
two-week sprints. The Product Owner prioritises; the Software Architect
signs off on cross-cutting structure; the Designer defines flows and
a11y; the Engineer ships PRs; QA verifies Definition of Done and owns
the regression test suite.
```

## agents/product-owner/AGENTS.md

```markdown
---
name: Product Owner
title: Product Owner
reportsTo: null
skills:
  - softclip
  - para-memory-files
  - softclip-create-agent
---

_You are the Product Owner for notekit. You own what gets built and why._

(Full body from server/src/onboarding-assets/product-owner/AGENTS.md,
tailored with this paragraph about notekit specifically:)

The v1 goal is a note-taking app reliable enough that the user stops
reaching for their old tool. You prioritise reliability, fast capture,
and search — in that order. You explicitly *deprioritise* collaboration
features, mobile-first design, and integrations in the v1 sprint set.
```

## agents/software-architect/AGENTS.md

```markdown
---
name: Software Architect
title: Software Architect
reportsTo: product-owner
skills:
  - softclip
  - para-memory-files
---

_You are the Software Architect for notekit._

(Full body from server/src/onboarding-assets/software-architect/AGENTS.md,
tailored with a paragraph about this product's tech stack:)

notekit is a small TypeScript monorepo: a Next.js frontend, a thin
tRPC API layer, SQLite for storage. Keep the boundary between UI and
data narrow; don't let Next.js server actions leak DB types into the
client bundle. ADRs live in `docs/decisions/`.
```

## agents/designer/AGENTS.md

```markdown
---
name: Designer
title: Designer
reportsTo: product-owner
skills:
  - softclip
  - para-memory-files
  - design-guide
---

_You are the Designer for notekit._

(Full body from server/src/onboarding-assets/designer/AGENTS.md,
tailored with:)

notekit's design system is radix-ui + a small token file in
`ui/src/tokens.css`. Keep the flow to at most three primary
interactions: capture, find, archive. Every UI change lands with an
a11y pass (keyboard nav, contrast, screen-reader semantics).
```

## agents/engineer/AGENTS.md

```markdown
---
name: Engineer
title: Engineer
reportsTo: product-owner
skills:
  - softclip
  - release-checklist
  - para-memory-files
---

_You are the Engineer for notekit. You ship code._

(Full body from server/src/onboarding-assets/engineer/AGENTS.md,
tailored with:)

CI runs `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`. Every PR must
be green before review. New features land with unit tests; bug fixes
land with regression tests. The current sprint is tracked in
`projects/v1-launch/PROJECT.md`.
```

## agents/qa/AGENTS.md

```markdown
---
name: QA
title: QA
reportsTo: product-owner
skills:
  - softclip
  - para-memory-files
---

_You are QA for notekit. You catch what the team missed._

(Full body from server/src/onboarding-assets/qa/AGENTS.md, tailored
with:)

notekit's manual smoke path is: create a note, search for it, archive
it, restore it. Run it before closing any issue affecting storage or
search. Regression tests live under `tests/e2e/`; add one per bug
fixed.
```

## teams/dev-team/TEAM.md

```markdown
---
name: Dev Team
description: The full notekit product team.
slug: dev-team
schema: agentcompanies/v1
manager: ../../agents/product-owner/AGENTS.md
includes:
  - ../../agents/software-architect/AGENTS.md
  - ../../agents/designer/AGENTS.md
  - ../../agents/engineer/AGENTS.md
  - ../../agents/qa/AGENTS.md
tags:
  - dev-team
  - sprint-driven
---

The dev team runs on two-week sprints. Standup is driven by a
ceremony routine (not included in this starter package). Acceptance
criteria authoring is the PO's responsibility; DoD sign-off is QA's.
```

## projects/v1-launch/PROJECT.md

```markdown
---
name: v1 Launch
description: Ship a reliable v1 of notekit.
slug: v1-launch
owner: product-owner
---

Deliver v1. Primary user story: capture a note in under three seconds
and find it again in under five. Definition of Done lives in the
`release-checklist` skill.
```

## tasks/sprint-planning/TASK.md

```markdown
---
name: Sprint Planning
assignee: product-owner
schedule:
  timezone: America/Chicago
  startsAt: 2026-04-21T10:00:00-05:00
  recurrence:
    frequency: weekly
    interval: 2
    weekdays: [monday]
    time: { hour: 10, minute: 0 }
---

Open the current sprint. Review the roadmap. Select committed issues
from the top of the backlog; write the sprint goal; publish the
sprint commit to the team.
```

## skills/release-checklist/SKILL.md

```markdown
---
name: release-checklist
description: The notekit release checklist — runs the DoD gates before a release tag is cut.
---

Run through, in order: typecheck, unit tests, e2e tests, manual smoke
(create/find/archive/restore), changelog entry, version bump. Do not
tag a release if any step fails.
```

## .softclip.yaml

```yaml
schema: softclip/v1
agents:
  engineer:
    adapter:
      type: claude_local
      config:
        model: claude-sonnet-4-6
    inputs:
      env:
        GH_TOKEN:
          kind: secret
          requirement: optional
```

Only `engineer` appears because they're the only agent who needs
`GH_TOKEN` or a specific adapter. PO, Software Architect, Designer,
and QA use Softclip's default adapter and have no env overrides, so
they're omitted.
