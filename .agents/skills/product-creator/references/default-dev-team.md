# Default Dev-Team Rosters

Three preset rosters for product-creator. Propose one in the interview,
adjust based on the user's answers, and generate the package.

The source of truth for each role's instructions is:

```
server/src/onboarding-assets/<role>/
```

That directory ships a five-file bundle per role (README, AGENTS,
HEARTBEAT, SOUL, TOOLS). When product-creator scaffolds a new
`agents/<role>/AGENTS.md`, start from the body of the matching
`onboarding-assets/<role>/AGENTS.md` — don't write a new one from
scratch.

## Starter (3 agents)

Right for side projects, MVPs, and anyone hiring their first AI team.

| Slug             | Reports to     | Primary responsibility                                            |
| ---------------- | -------------- | ----------------------------------------------------------------- |
| `product-owner`  | *(root)*       | Owns roadmap, prioritises, writes acceptance criteria.            |
| `engineer`       | `product-owner`| Implements, writes tests, opens PRs, responds to review.          |
| `qa`             | `product-owner`| Writes test plans, authors regression tests, signs off DoD.       |

Suggest Starter when the user is solo, the codebase is small, or they
haven't articulated design or architecture concerns.

## Standard (5 agents)

Right for a small team shipping a real product with a UI.

| Slug                  | Reports to     | Primary responsibility                                        |
| --------------------- | -------------- | ------------------------------------------------------------- |
| `product-owner`       | *(root)*       | Owns roadmap, prioritises, writes acceptance criteria.        |
| `software-architect`  | `product-owner`| Owns code structure, API contracts, refactor proposals.       |
| `designer`            | `product-owner`| Owns flows, wireframes, design-system compliance, a11y.       |
| `engineer`            | `product-owner`| Implements, writes tests, opens PRs.                          |
| `qa`                  | `product-owner`| Writes test plans, owns bug triage, signs off DoD.            |

Suggest Standard for most product dev teams. It's the default if you
can't decide.

## Full (7 agents)

Right when the product has non-trivial integrations, a complex data
model, or multiple services.

| Slug                  | Reports to     | Primary responsibility                                              |
| --------------------- | -------------- | ------------------------------------------------------------------- |
| `product-owner`       | *(root)*       | Owns roadmap, prioritises, writes acceptance criteria.              |
| `software-architect`  | `product-owner`| Internal code structure, API contracts, refactor proposals.         |
| `solution-architect`  | `product-owner`| Integrations, deployment topology, cross-service contracts.         |
| `data-architect`      | `product-owner`| Schema, migrations, indexing, PII, data lifecycle.                  |
| `designer`            | `product-owner`| Flows, wireframes, design-system, a11y.                             |
| `engineer`            | `product-owner`| Implements, writes tests, opens PRs.                                |
| `qa`                  | `product-owner`| Test plans, regression tests, DoD sign-off, bug triage.             |

Suggest Full only when:

- The product talks to ≥ 2 external systems worth a Solution Architect's
  attention.
- The data model is growing past a handful of tables and a Data
  Architect will genuinely gate migrations.
- The user asks for separation between internal and external
  architecture concerns.

## Rules for custom rosters

If the user wants to deviate from these presets:

- **Never drop the Product Owner.** Someone must own prioritisation; if
  you rename the role to "Lead" or "Manager," that's fine, but
  `reportsTo: null` is reserved for them.
- **Add a role, don't split one.** If the user wants an ML Engineer,
  add `ml-engineer` as a new role reporting to PO. Don't try to
  split Engineer into two.
- **Keep architects clustered under PO.** Don't chain architects (e.g.,
  Solution → Software); they make lateral calls, not hierarchical
  ones.
- **Never have more than 6 direct reports under PO without an
  intermediate manager.** If the roster grows that big, introduce a
  `tech-lead` between PO and the architects + engineers, and leave
  Designer and QA reporting directly to PO.

## Why AGENTS.md bodies are authored, not generated

The onboarding-asset bundles were designed so a teammate can open them
six months later and still understand what the agent should do. Each
AGENTS.md is 90+ lines of concrete scope, delegation routing, non-goals,
escalation paths, and artifacts the role owns.

When product-creator runs, it re-uses those bodies — it doesn't
regenerate them. That keeps the quality bar consistent across every
product scaffolded with this skill.
