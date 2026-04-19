# Onboarding assets

This directory holds the **instruction bundles that ship with every
default agent role**. When a Product Owner creates a new agent, the
five files in the matching role folder get copied into that agent's
personal directory. Edit the files here to change the defaults for
every future agent you hire in that role.

## Default roles

| Folder                   | Role                | Reports to | What they do (one-liner)                                                  |
| ------------------------ | ------------------- | ---------- | ------------------------------------------------------------------------- |
| `product-owner/`         | Product Owner       | *(none — root)* | Owns what gets built and why. Delegates to everyone else.           |
| `software-architect/`    | Software Architect  | Product Owner | Owns internal code structure, API contracts, refactor proposals.       |
| `solution-architect/`    | Solution Architect  | Product Owner | Owns system-boundary design: integrations, deployment, cross-service.  |
| `data-architect/`        | Data Architect      | Product Owner | Owns schema, migrations, indexing, PII, data lifecycle.                |
| `designer/`              | Designer            | Product Owner | Owns user flows, wireframes, design-system usage, a11y, user copy.     |
| `engineer/`              | Engineer            | Product Owner | Ships code. Implements, tests, opens PRs, responds to review.          |
| `qa/`                    | QA                  | Product Owner | Writes test plans, authors regression tests, signs off DoD, triages bugs. |
| `security/`              | Security            | Product Owner | Optional. Runs vulnerability scans, owns CVE triage, reviews security-sensitive PRs, threat-models new surfaces, contributes a security section to every plan. |
| `devops/`                | DevOps              | Product Owner | Optional. Owns CI/CD, infrastructure-as-code, release cuts, observability, incident response, and contributes a deploy/ops section to every plan. |

Plus two special folders:

- **`_template/`** — stub bundle that `product-creator` and any
  future role-add flow copies from. If you add a new role, start
  here.
- **`ceo/`** (legacy) — the original Paperclip CEO bundle. Will be
  removed once the Softclip pivot is fully rolled out; kept temporarily
  so existing companies keep booting.

## Every role folder has five files

| File            | Audience               | Purpose                                                             |
| --------------- | ---------------------- | ------------------------------------------------------------------- |
| `README.md`     | **Humans**             | TL;DR of the role, list of knobs you can tweak, change-log.         |
| `AGENTS.md`     | Agent at runtime       | Scope, delegation rules, non-goals, escalation, artifacts owned.    |
| `HEARTBEAT.md`  | Agent at runtime       | Step-by-step checklist the agent runs every heartbeat.              |
| `SOUL.md`       | Agent at runtime       | Tone, values, decision heuristics. Keeps outputs coherent.          |
| `TOOLS.md`      | Agent at runtime       | Which tools/skills to reach for, with "use this when" per tool.     |

The loader (`server/src/services/default-agent-instructions.ts`)
enumerates these folders and exposes them through the API; the
onboarding wizard and "create agent" flow pull from here.

## Editing a bundle

1. Open the role's `README.md` first — it lists the knobs most likely
   to matter.
2. Edit the specific file the knob points to.
3. Update the change-log table at the bottom of the role's `README.md`.
4. Run `pnpm --filter @paperclipai/server test -- onboarding-assets-structure`
   to verify structure (every file present, required AGENTS.md
   sections non-empty).

For a walk-through of what to change vs. what to leave alone, see
[`docs/guides/board-operator/customizing-agents.md`](../../../docs/guides/board-operator/customizing-agents.md).

## Adding a new role

1. Copy `_template/` to `<new-role-name>/`.
2. Fill in every `<placeholder>` in the five files.
3. Add a row to the "Default roles" table above.
4. Register the role in
   `server/src/services/default-agent-instructions.ts`.
5. Re-run the structure test.

## Why five files?

Each file has a distinct audience or purpose — merging any two
degrades both:

- `README.md` is for humans. Mix it with `AGENTS.md` and agents
  waste tokens reading things meant for you.
- `AGENTS.md` is the prompt. It's the one file the agent must
  absorb fully to act correctly.
- `HEARTBEAT.md` is the ritual. Separating it from `AGENTS.md` lets
  you evolve the ritual without rewriting the role definition.
- `SOUL.md` is the voice. Separating it lets you tune tone without
  touching behavior.
- `TOOLS.md` is the affordance list. Separating it lets you add
  tools without touching the persona.
