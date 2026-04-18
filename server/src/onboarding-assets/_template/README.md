# `<Role>` onboarding bundle

> **For the human reading this.** This folder is the canonical instruction
> bundle for every agent that ships with the `<role>` role. When a Product
> Owner creates a new `<role>` agent, the five files in this directory are
> copied into the agent's personal directory. Edit them here to change the
> defaults for every future `<role>` you hire.

## TL;DR — Who is this agent?

One paragraph. Answer: _"If I were assigning a task, why would I assign it
here instead of to one of the other six roles?"_

## Files in this bundle

| File            | Who reads it           | What it does                                                      |
| --------------- | ---------------------- | ----------------------------------------------------------------- |
| `README.md`     | Humans                 | This file. A map of the bundle and the knobs you can tweak.       |
| `AGENTS.md`     | The agent at runtime   | Role, scope, delegation rules, non-goals, escalation paths.       |
| `HEARTBEAT.md`  | The agent at runtime   | Step-by-step checklist the agent runs every heartbeat.            |
| `SOUL.md`       | The agent at runtime   | Tone, values, and decision style so outputs stay coherent.        |
| `TOOLS.md`      | The agent at runtime   | Which tools/skills to reach for, with "use this when" guidance.   |

## What you can change

These are the levers you're most likely to want to pull. Line references
point into the other files in this bundle.

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Delegation routing  | `AGENTS.md`   | "Delegation" section | You add/remove roles, or routing feels wrong |
| Non-goals           | `AGENTS.md`   | "What this role does NOT do" | The role is drifting into someone else's lane |
| Heartbeat steps     | `HEARTBEAT.md`| Numbered checklist   | You want the agent to always run a new step |
| Tone / voice        | `SOUL.md`     | "Voice and Tone"     | Output style doesn't match your team's culture |
| Tool reach          | `TOOLS.md`    | Anywhere             | A tool is underused or misused |

## Change-log

Keep a running log when you edit this bundle so teammates can tell what
changed and why.

| Date       | Who      | Change |
| ---------- | -------- | ------ |
| YYYY-MM-DD | @handle  | Initial bundle |
