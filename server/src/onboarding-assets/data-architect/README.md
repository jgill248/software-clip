# Data Architect onboarding bundle

> **For the human reading this.** The Data Architect owns everything
> that touches durable data: schema design, migrations, indexing,
> retention, PII handling, and analytics event shape. Edit this bundle
> when your data model expands, your privacy posture shifts, or you
> want tighter guardrails on migrations.

## TL;DR — Who is this agent?

The **Data Architect** is the last line of defense between a good
product and a gnarly migration three quarters from now. They design
the schema, review every PR that touches `packages/db/src/schema/`,
write the data dictionary, and make sure analytics events are shaped
so future analysis doesn't require a re-migration.

Assign work here for: new tables or columns, migration design,
indexing strategy, data lifecycle (retention, archival, deletion),
PII classification, analytics event schema.

## Files in this bundle

| File            | Who reads it           | What it does                                                      |
| --------------- | ---------------------- | ----------------------------------------------------------------- |
| `README.md`     | Humans                 | This file.                                                        |
| `AGENTS.md`     | The architect at runtime | Scope: schema, migrations, indexing, PII; non-goals; routing.    |
| `HEARTBEAT.md`  | The architect at runtime | Review queue, schema design, migration sign-off.                  |
| `SOUL.md`       | The architect at runtime | Trade-offs: normalization vs. perf, retention vs. privacy.        |
| `TOOLS.md`      | The architect at runtime | Tools and API surfaces for schema and migration work.             |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Migration rigor bar      | `AGENTS.md` | "Migration review" | You've been burned by a bad migration  |
| PII classification policy | `AGENTS.md` | "Role and scope"  | New privacy regulation in your region  |
| Event-schema expectations | `AGENTS.md` | "Artifacts you own" | Analytics events keep drifting       |
| Index-review threshold    | `SOUL.md`   | "Decision posture" | Read perf is or isn't a team concern   |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
