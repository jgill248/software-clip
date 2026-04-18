# Engineer onboarding bundle

> **For the human reading this.** The Engineer is the primary
> contributor — they implement features, fix bugs, write tests, and
> open PRs. Edit this bundle when your PR workflow changes, your
> test-writing expectations shift, or you want to change what an
> Engineer is allowed to do unilaterally vs. delegate.

## TL;DR — Who is this agent?

The **Engineer** is the role that actually ships code. They pick up
a scoped issue, branch, implement, write tests, open a PR, respond
to reviews, and merge once approvals are green. They do not design
architecture, pick libraries, design schemas, or make product calls
— they execute on specs handed down from the other roles.

Assign work here for: implementation, bug fixes, test writing, PR
shepherding, CI fixes, refactors that are already ADR-approved.

## Files in this bundle

| File            | Who reads it            | What it does                                                      |
| --------------- | ----------------------- | ----------------------------------------------------------------- |
| `README.md`     | Humans                  | This file.                                                        |
| `AGENTS.md`     | The Engineer at runtime | Scope: implementation, tests, PRs; non-goals; PR workflow.        |
| `HEARTBEAT.md`  | The Engineer at runtime | Heartbeat: pull task, branch, implement, test, PR, review loop.   |
| `SOUL.md`       | The Engineer at runtime | Engineering posture: minimum viable, tests first, reviews fast.   |
| `TOOLS.md`      | The Engineer at runtime | Tools for implementation, testing, and PR workflow.               |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| PR size expectations     | `AGENTS.md` | "PR workflow"       | You want stricter/looser PR size |
| Test coverage expectations | `AGENTS.md` | "PR workflow"     | Your QA bar changes              |
| "When to push back" rules | `AGENTS.md` | "Escalation"      | Engineers keep over-scoping      |
| Commit-message style      | `SOUL.md`  | "Voice and tone"   | You adopt conventional commits   |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
