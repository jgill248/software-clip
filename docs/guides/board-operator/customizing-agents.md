---
title: Customizing Agent Instructions
summary: How to edit the default instruction bundles your agents ship with
---

Every default role in Softclip (Product Owner, Software Architect,
Solution Architect, Data Architect, Designer, Engineer, QA) ships with a
five-file **instruction bundle**. When you hire a new agent in one of
those roles, Softclip copies the bundle into that agent's personal
directory as their starting instructions. This guide walks through what
lives in those bundles, what you can safely change, and how to test a
change before it lands.

## Where the bundles live

```
server/src/onboarding-assets/
├── README.md                 ← index explaining the convention
├── _template/                ← stub bundle for adding a new role
├── product-owner/
├── software-architect/
├── solution-architect/
├── data-architect/
├── designer/
├── engineer/
└── qa/
```

Every role folder has exactly five files:

| File            | Audience               | Purpose                                                             |
| --------------- | ---------------------- | ------------------------------------------------------------------- |
| `README.md`     | **Humans** (you)       | TL;DR of the role, knobs table, change-log.                         |
| `AGENTS.md`     | The agent at runtime   | Scope, delegation, non-goals, escalation, artifacts owned.          |
| `HEARTBEAT.md`  | The agent at runtime   | Step-by-step checklist the agent runs every heartbeat.              |
| `SOUL.md`       | The agent at runtime   | Tone, values, decision heuristics.                                  |
| `TOOLS.md`      | The agent at runtime   | Which tools/skills to reach for, with "use this when" per tool.     |

The `README.md` is for maintainers; it's not loaded into the agent's
runtime context.

## Start with the role's README

When you want to tweak a role, **open that role's `README.md` first**.
The "What you can change" table lists the knobs most likely to matter
with line references into the other files. It's the map; the other four
files are the terrain.

## What's safe to change

- **Delegation routing** in `AGENTS.md`. If your team's shape differs
  from the default (e.g., you merged Software and Solution Architects
  into one role), update the routing tables.
- **Non-goals** in `AGENTS.md`. Tightening non-goals ("Product Owner
  must never comment on GitHub") is how you lock down role boundaries
  when agents drift.
- **Heartbeat steps** in `HEARTBEAT.md`. Add steps for your team's
  specific workflow. Order matters; the ordering reflects priority at
  runtime.
- **Voice and decision posture** in `SOUL.md`. If your team's tone
  differs from the default, tune here.
- **Tool recommendations** in `TOOLS.md`. New tool in the mix? Add a
  line with "use this when..." guidance.

## What's risky to change

- **The five-file structure itself.** The structure-validator test
  (`onboarding-assets-structure.test.ts`) enforces it. If a file is
  missing or a section marker disappears, CI fails.
- **The italic TL;DR opener** in `AGENTS.md` (`_You are ..._`). Tools
  and humans alike rely on it as a consistent entry point.
- **Required sections** in `AGENTS.md`: *Role and scope*, *Delegation*,
  *What this role does NOT do* (or equivalent non-goals phrasing), and
  *Escalation*. The validator will reject bundles missing any of these.

## Testing a change

After editing a bundle:

1. Run the structure validator:
   ```
   pnpm --filter @softclipai/server test -- onboarding-assets-structure
   ```
2. Start a dev instance and hire a fresh agent in that role. Confirm
   the new instructions land in the agent's personal directory.
3. Let the agent run one heartbeat and read the comment it leaves. If
   the behavior changed as you intended, the edit is good. If not,
   iterate on the file that governs that behavior.

## Adding a new role

1. Copy `_template/` to `<new-role>/` under `server/src/onboarding-assets/`.
2. Replace every `<placeholder>` in the five files.
3. Register the role in
   [`server/src/services/default-agent-instructions.ts`](../../../server/src/services/default-agent-instructions.ts):
   add an entry to `DEFAULT_AGENT_BUNDLE_FILES`, and add the role
   string(s) you want to accept in `ROLE_STRING_ALIASES`.
4. Update `DEFAULT_ROLE_DIRS` in
   [`server/src/__tests__/onboarding-assets-structure.test.ts`](../../../server/src/__tests__/onboarding-assets-structure.test.ts)
   to include the new folder.
5. Run the structure validator and the full server test suite.

## Keeping changes traceable

Each role's `README.md` has a **Change-log** table at the bottom. Add a
row every time you edit the bundle — date, your handle, what changed.
It's the cheapest possible form of history; skipping it means the next
maintainer can't tell what was always this way vs. what your team
changed last month.
