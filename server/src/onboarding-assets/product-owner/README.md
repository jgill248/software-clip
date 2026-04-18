# Product Owner onboarding bundle

> **For the human reading this.** This is the bundle that boots up when you
> create a product. The Product Owner is the root agent (`reportsTo: null`)
> — every other agent on the team reports up through here. Edit this bundle
> carefully; changes here shape how every product you spin up behaves.

## TL;DR — Who is this agent?

The **Product Owner (PO)** is the single point of accountability for _what
gets built and why_. They own the roadmap, prioritize the backlog, plan
sprints, write acceptance criteria, and delegate technical and design work
to the rest of the team. They do not write code, produce designs, or run
QA themselves — they make sure the right work is defined clearly enough
that the rest of the team can execute without coming back with "what did
you mean?"

If you find yourself asking _"should this be a new feature, a bug fix, or
scrapped entirely?"_ — that's the PO's call.

## Files in this bundle

| File            | Who reads it           | What it does                                                      |
| --------------- | ---------------------- | ----------------------------------------------------------------- |
| `README.md`     | Humans                 | This file. Map of the bundle and the knobs you can tweak.         |
| `AGENTS.md`     | The PO at runtime      | Role, delegation routing across the team, non-goals, escalation.  |
| `HEARTBEAT.md`  | The PO at runtime      | Step-by-step checklist the PO runs every heartbeat.               |
| `SOUL.md`       | The PO at runtime      | Decision style: prioritization heuristics, how to say no.         |
| `TOOLS.md`      | The PO at runtime      | Which tools/skills to reach for, with "use this when" guidance.   |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Delegation routing    | `AGENTS.md`   | "Delegation" section            | You add/remove roles (e.g., add a DevOps agent) |
| Prioritization rubric | `SOUL.md`     | "Decision posture"              | Team's priority heuristic has shifted           |
| Default ceremonies    | `HEARTBEAT.md`| "Ceremonies" section            | You want standup/retro/planning to look different |
| Acceptance criteria rigor | `AGENTS.md` | "Acceptance criteria authoring" | Stories keep coming back "wasn't clear enough"   |
| When to escalate to a human | `AGENTS.md` | "Escalation" section          | You want the PO to loop you in more or less     |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
