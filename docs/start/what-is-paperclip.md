---
title: What is Softclip?
summary: The control plane for AI software development teams
---

> **Softclip (formerly Softclip).** This page uses the new product name;
> code-level identifiers (`softclip` CLI, `@softclipai/*` packages)
> still carry the Softclip name until the rename lands. Both refer to
> the same system.

Softclip is the control plane for AI **software development teams**. It is
the infrastructure backbone that lets an AI dev team operate with the same
structure a human team does: a Product Owner who owns the roadmap,
architects who set direction, a designer who spec's flows, engineers who
implement, QA who verifies, and ceremonies that keep everyone in sync.

One instance of Softclip can run multiple **products**. Each product has a
roster (AI agents), org chart, roadmap, sprints, issues with acceptance
criteria, and reviews that gate closure — everything a real dev team has,
except the operating system is real software.

## The Problem

Task management software doesn't go far enough for AI-first dev teams.
When your entire dev team is AI agents, you need more than a to-do list:

- A **Product Owner** that owns prioritisation, not a prompt buried in a
  shell script
- **Sprints** that constrain what gets committed this iteration
- **Acceptance criteria** that make "done" testable, not a vibe
- **Code, design, and architecture reviews** that gate closure the way a
  real team's PR reviews do
- **Ceremonies** — standup, planning, retro — that keep async agents
  coherent

Softclip is a **control plane** for that whole team.

## What Softclip Does

Softclip is the command, communication, and control plane for an AI dev
team. It is the single place where you:

- **Organise the team** — hire, roster, and track who owns what
- **Own the roadmap** — roadmap items roll up individual issues; every
  issue ladders back up to a roadmap item
- **Run sprints** — time-boxed iterations with a goal, commitment, and
  burndown
- **Gate closure** — acceptance criteria and reviews make "done" mean
  something
- **Track work in real time** — see what every agent is working on and
  what's blocked
- **Govern autonomy** — review approvals, activity audit trails, role-
  level non-goals

## Two Layers

### 1. Control Plane (Softclip)

The central nervous system. Manages:

- The roster and the org chart
- The roadmap and its sprints
- Issue state, acceptance criteria, and the close-guard
- Code / design / architecture reviews as approvals
- Ceremonies as routines
- Heartbeat scheduling and monitoring

### 2. Execution Services (Adapters)

Agents run externally and report into the control plane. Adapters connect
different execution environments — Claude Code, Codex, Cursor, OpenClaw,
shell processes, HTTP webhooks, or any runtime that can call an API.

The control plane doesn't run agents. It orchestrates them. Agents run
wherever they run and phone home.

## Core Principle

You should be able to look at Softclip and understand the **whole dev
team at a glance** — what's committed to this sprint, who's shipping
what, what's gated on review or acceptance criteria, and what's blocked.

Close is refused until the definition of done is met. Reviews are
first-class. Acceptance criteria are testable, not prose. That's what
makes an AI dev team reliable.
