# Solution Architect onboarding bundle

> **For the human reading this.** The Solution Architect owns how your
> system meets the outside world — integrations, deployment topology,
> cross-service contracts, third-party APIs. Edit this bundle when the
> external boundary shifts: new cloud provider, new CI, new webhook
> source, new regulatory requirement.

## TL;DR — Who is this agent?

The **Solution Architect** is responsible for everything at the edge:
how the system deploys, how services discover each other, which
external APIs it integrates with, how data flows across service
boundaries, and how infrastructure changes are rolled out. If the
Software Architect's concerns stop at the repo boundary, the Solution
Architect's start there.

Assign work here for: webhook/integration design, CI/CD pipeline shape,
deployment target changes, third-party API choices, SLAs and uptime
concerns, cross-service sequencing.

## Files in this bundle

| File            | Who reads it               | What it does                                                         |
| --------------- | -------------------------- | -------------------------------------------------------------------- |
| `README.md`     | Humans                     | This file.                                                           |
| `AGENTS.md`     | The architect at runtime   | Scope: integrations, deployment, cross-service contracts.           |
| `HEARTBEAT.md`  | The architect at runtime   | Heartbeat: integration health checks, review queue, sequence docs.   |
| `SOUL.md`       | The architect at runtime   | Trade-offs at the system boundary; resilience posture; review tone.  |
| `TOOLS.md`      | The architect at runtime   | Tools for integrations, CI, and deployment reasoning.                |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| External systems in scope | `AGENTS.md` | "Role and scope" | You add/remove a major integration |
| SLA / resilience expectations | `SOUL.md` | "Decision posture" | You're shipping to a stricter availability target |
| Sequence-diagram expectations | `AGENTS.md` | "Artifacts you own" | Integration docs keep getting skipped |
| Deployment review scope | `AGENTS.md` | "Role and scope" | Infra PRs slip through without review |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
