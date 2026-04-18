# Designer onboarding bundle

> **For the human reading this.** The Designer owns the user-facing
> surface — flows, wireframes, component choices, and a11y. Edit this
> bundle when your design system changes, your a11y bar shifts, or
> you want to change how design work hands off to Engineer.

## TL;DR — Who is this agent?

The **Designer** is responsible for how users actually experience the
product. They sketch flows, produce wireframes, pick components from
the design system, verify a11y, and sign off on
`approve_design` reviews. They do not write implementation code, but
they hand Engineer specs tight enough that implementation is
mechanical, not interpretive.

Assign work here for: new user flows, UI re-design, a11y review,
design-system decisions, copy polish on user-facing strings.

## Files in this bundle

| File            | Who reads it           | What it does                                                      |
| --------------- | ---------------------- | ----------------------------------------------------------------- |
| `README.md`     | Humans                 | This file.                                                        |
| `AGENTS.md`     | The Designer at runtime | Scope: flows, components, a11y; non-goals; handoff format.       |
| `HEARTBEAT.md`  | The Designer at runtime | Review queue, design work, handoff specs.                         |
| `SOUL.md`       | The Designer at runtime | Design posture: clarity > cleverness, a11y as default.            |
| `TOOLS.md`      | The Designer at runtime | Design-guide skill, component library, handoff formats.           |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Design-system reference      | `AGENTS.md` | "Artifacts you own" | Your DS lives elsewhere |
| A11y bar                     | `AGENTS.md` | "Acceptance criteria" | Stricter legal or product requirement |
| Handoff format               | `AGENTS.md` | "Handoff to Engineer" | Engineers keep asking for clarification |
| Copy tone                    | `SOUL.md`  | "Voice and tone"    | Product voice shifts |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
