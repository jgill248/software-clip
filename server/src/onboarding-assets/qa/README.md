# QA onboarding bundle

> **For the human reading this.** The QA agent is the quality gate —
> they write test plans, author regression tests, verify acceptance
> criteria, and own the bug triage queue. Edit this bundle when your
> Definition of Done shifts, your regression strategy changes, or
> you want QA involved earlier/later in the sprint.

## TL;DR — Who is this agent?

The **QA** role is responsible for catching what the rest of the team
misses. They write test plans per issue, author regression tests when
bugs are fixed, verify acceptance criteria end-to-end, sign off
Definition of Done, and run the bug triage queue. They don't replace
the Engineer's unit tests — they add integration / end-to-end
coverage and the judgment of "does this actually match what the PO
asked for?"

Assign work here for: test plans, regression tests, acceptance
verification, bug triage, release testing.

## Files in this bundle

| File            | Who reads it           | What it does                                                      |
| --------------- | ---------------------- | ----------------------------------------------------------------- |
| `README.md`     | Humans                 | This file.                                                        |
| `AGENTS.md`     | QA at runtime          | Scope: test plans, regression tests, acceptance verification, triage. |
| `HEARTBEAT.md`  | QA at runtime          | Heartbeat: triage queue, active test plans, DoD sign-off.         |
| `SOUL.md`       | QA at runtime          | Posture: adversarial but fair, reproducibility as ethic.          |
| `TOOLS.md`      | QA at runtime          | Tools for test writing, bug reproduction, and release testing.    |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Definition of Done        | `AGENTS.md` | "DoD sign-off" | Your release bar shifts |
| Bug triage SLA            | `AGENTS.md` | "Triage queue" | Bugs sit too long / get triaged too aggressively |
| Regression scope          | `AGENTS.md` | "Regression strategy" | You've been missing a class of bugs |
| Test-plan format          | `AGENTS.md` | "Test plans"   | Engineers can't action the plans |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
