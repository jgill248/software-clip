# Softclip

**Softclip is the control plane for autonomous AI software-development teams.** We are building the infrastructure that lets a Product Owner, architects, designer, engineer, and QA — running as AI agents — ship real software together, with the same rhythms a good human team uses: sprints, reviews, ceremonies, and a Definition of Done.

Our goal is for Softclip-powered dev teams to collectively ship software that matters — durably, reproducibly, and at a cost a solo operator can afford.

## The Vision

AI software-dev teams — _many_ of them — running real work, with real governance, will become a dominant mode of how software gets built. Not one team. Thousands. Every solo operator, agency, and small shop should be able to spin up a team, point it at a repo, and watch stories move through the board to `done`.

Softclip is not the team. Softclip is what makes the team possible. We are the control plane: the shared board, the sprint state machine, the review gates, the ceremonies that keep the team honest. Every autonomous dev team needs structure, accountability, and a clear Definition of Done. That's us.

The measure of success is whether Softclip becomes the default way people run AI dev teams — and whether those teams reliably ship work that a human operator trusts and takes credit for.

## The Problem

Task management software doesn't go far enough. When your entire team is AI agents, you need more than a to-do list — you need a **control plane** for a dev team: a backlog, a roadmap, sprints, PR reviews, acceptance criteria, and a Product Owner who prioritises.

## What Softclip Is

Softclip is the command, communication, and control plane for a dev team of AI agents. It is the single place where you:

- **Manage agents as teammates** — hire, organise, and track who does what under the Product Owner
- **Define team structure** — an org chart that agents themselves operate within
- **Track work in real time** — see at any moment what every agent is working on, in what sprint, against what acceptance criteria
- **Run real ceremonies** — standup, sprint planning, sprint review, retrospective, backlog grooming
- **Gate closure on quality** — acceptance criteria and Definition of Done are enforced, not advisory
- **Align to the roadmap** — every issue traces back to a roadmap item; agents see _why_ they're building what they're building

## Architecture

Two layers:

### 1. Control Plane (this software)

The central nervous system. Manages:

- Agent registry and org chart (Product Owner at the root)
- Roadmap, sprints, and issues
- Acceptance criteria and the Definition-of-Done close-guard
- Reviews (code / design / architecture / PO strategy)
- Ceremonies as first-class scheduled routines
- Heartbeat monitoring — know when agents are alive, idle, or stuck

### 2. Execution Services (adapters)

Agents run externally and report into the control plane. Softclip doesn't run the agents; it orchestrates them. Adapters connect different runtimes:

- **Claude Code, Codex, Cursor, Gemini, OpenCode, Pi** — local adapters
- **OpenClaw** — gateway adapter for remote claw-style runtimes
- **HTTP / process** — anything that can receive a heartbeat

## Core Principle

You should be able to look at Softclip and understand your dev team at a glance — what sprint it's in, what issues are in flight, what's blocking, and whether the work is ready to close.
