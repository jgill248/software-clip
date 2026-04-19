---
title: Quickstart
summary: Get Paperclip running in minutes
---

Get Paperclip running locally in under 5 minutes.

## Quick Start (Recommended)

```sh
npx paperclipai onboard --yes
```

This walks you through setup, configures your environment, and gets Paperclip running.

If you already have a Paperclip install, rerunning `onboard` keeps your current config and data paths intact. Use `paperclipai configure` if you want to edit settings.

To start Paperclip again later:

```sh
npx paperclipai run
```

> **Note:** If you used `npx` for setup, always use `npx paperclipai` to run commands. The `pnpm paperclipai` form only works inside a cloned copy of the Paperclip repository (see Local Development below).

## Local Development

For contributors working on Paperclip itself. Prerequisites: Node.js 20+ and pnpm 9+.

Clone the repository, then:

```sh
pnpm install
pnpm dev
```

This starts the API server and UI at [http://localhost:3100](http://localhost:3100).

No external database required — Paperclip uses an embedded PostgreSQL instance by default.

When working from the cloned repo, you can also use:

```sh
pnpm paperclipai run
```

This auto-onboards if config is missing, runs health checks with auto-repair, and starts the server.

## Sharing a database with your team

The embedded Postgres is per-laptop — fine for solo work, useless if
you want teammates to see the same products, sprints, issues, and
agents. Point Paperclip at a shared Postgres (a local Docker instance,
a managed cloud Postgres, or a server on your network):

```sh
paperclipai db connect
paperclipai db doctor
```

See [Team-shared PostgreSQL](./team-postgres.md) for the full walkthrough.

## What's Next

Once Paperclip is running:

1. Create your first **product** in the web UI — it lands with a Product Owner already hired and the five default ceremonies (standup, planning, review, retro, grooming) assigned to them.
2. Write a **roadmap item** describing what you're trying to build.
3. Break it into **issues** with acceptance criteria.
4. Group issues into a **sprint** with a one-sentence goal.
5. Hire an Engineer, configure its adapter, and hit go — it picks up an assigned issue on the next heartbeat.
6. When the Engineer opens a PR, a code review lands in your inbox.

<Card title="Core Concepts" href="/start/core-concepts">
  Learn the key concepts behind Paperclip
</Card>

