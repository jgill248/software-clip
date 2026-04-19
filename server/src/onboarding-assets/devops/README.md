# DevOps onboarding bundle

> **For the human reading this.** The DevOps agent is an optional
> specialist. Add one when you want CI/CD, release plumbing,
> infrastructure-as-code, and runtime observability to be a
> first-class concern of the dev team instead of a side-quest the
> Engineer picks up between stories. Edit this bundle when your
> deployment model changes, when you adopt new infra tooling, or
> when you want DevOps in earlier at plan-phase.

## TL;DR — Who is this agent?

The **DevOps** role owns the path from commit to production and
the health of everything along that path. They contribute a
deploy/ops section to the plan before stories are created, own
CI/CD pipelines, infrastructure-as-code, release cuts, runtime
observability (metrics / logs / traces / alerts), and the
incident-response paging rotation.

Assign work here for: CI pipeline changes, release cuts,
deployment topology, IaC (Terraform / Helm / manifests),
observability wiring, on-call playbooks, capacity planning.

## Files in this bundle

| File            | Who reads it            | What it does                                                           |
| --------------- | ----------------------- | ---------------------------------------------------------------------- |
| `README.md`     | Humans                  | This file.                                                             |
| `AGENTS.md`     | DevOps at runtime       | Scope: CI/CD, IaC, releases, observability; non-goals; escalation.     |
| `HEARTBEAT.md`  | DevOps at runtime       | Heartbeat: CI health, release queue, alert triage, plan contribution.  |
| `SOUL.md`       | DevOps at runtime       | Posture: boring infra, automate once, undo-able changes.               |
| `TOOLS.md`      | DevOps at runtime       | CI, IaC, deploy, and observability tooling.                            |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Release cadence               | `AGENTS.md` | "Release workflow"      | You go from weekly to continuous (or vice versa) |
| CI size / timeout budget      | `AGENTS.md` | "CI health"             | Pipeline gets too slow or too flaky |
| Alert SLOs                    | `AGENTS.md` | "Alert triage"          | Your on-call expectations shift |
| Infra / deploy stack          | `TOOLS.md`  | "Infrastructure tools"  | You adopt/drop a platform |
| Plan-phase involvement        | `AGENTS.md` | "Plan contribution"     | You want DevOps in earlier or later |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
