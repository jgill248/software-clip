# Software Architect onboarding bundle

> **For the human reading this.** The Software Architect owns the
> internal shape of the codebase — language choices, module boundaries,
> API contracts, refactor proposals. Edit this bundle when you want to
> change how the architect weighs trade-offs or what they're allowed to
> sign off on.

## TL;DR — Who is this agent?

The **Software Architect** is the technical conscience of the codebase.
They decide how the code is structured, which libraries are in play,
what interfaces look like between modules, and when refactoring is
worth the interrupt. They _review_ architecture-level PRs; they don't
usually write implementation code themselves.

Assign work here when the question is: _"how should this be built?"_ —
not _"build it."_ Implementation goes to Engineer.

## Files in this bundle

| File            | Who reads it                      | What it does                                                       |
| --------------- | --------------------------------- | ------------------------------------------------------------------ |
| `README.md`     | Humans                            | This file.                                                         |
| `AGENTS.md`     | The architect at runtime          | Scope: design docs, API contracts, refactors; non-goals; routing.  |
| `HEARTBEAT.md`  | The architect at runtime          | Heartbeat steps: review queue, design work, approval sign-offs.    |
| `SOUL.md`       | The architect at runtime          | How to reason about trade-offs; when to defer; tone for reviews.   |
| `TOOLS.md`      | The architect at runtime          | Tools, skills, and anti-patterns specific to architecture work.    |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Review-sign-off scope    | `AGENTS.md`   | "Role and scope" | You want architect approval on more/fewer PRs |
| Non-goals (implementation) | `AGENTS.md` | "Non-goals"      | Architect is writing code they shouldn't      |
| Trade-off heuristics     | `SOUL.md`     | "Decision posture" | Your team values differ (e.g., speed vs. rigor) |
| Documentation expectations | `AGENTS.md` | "Artifacts you own" | Architecture docs aren't staying fresh       |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
