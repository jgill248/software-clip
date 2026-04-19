---
title: Quickstart
summary: Get Softclip running in minutes
---

Get Softclip running locally in under 5 minutes.

## Quick Start (Recommended)

```sh
npx softclip onboard --yes
```

This walks you through setup, configures your environment, and gets Softclip running.

If you already have a Softclip install, rerunning `onboard` keeps your current config and data paths intact. Use `softclip configure` if you want to edit settings.

To start Softclip again later:

```sh
npx softclip run
```

> **Note:** If you used `npx` for setup, always use `npx softclip` to run commands. The `pnpm softclip` form only works inside a cloned copy of the Softclip repository (see Local Development below). The CLI is also available as `softclip` (the npm package name during the rename); both invocations point at the same binary.

## Local Development

For contributors working on Softclip itself. Prerequisites: Node.js 20+ and pnpm 9+.

Clone the repository, then:

```sh
pnpm install
pnpm dev
```

This starts the API server and UI at [http://localhost:3100](http://localhost:3100).

No external database required — Softclip uses an embedded PostgreSQL instance by default.

When working from the cloned repo, you can also use:

```sh
pnpm softclip run
```

This auto-onboards if config is missing, runs health checks with auto-repair, and starts the server.

## Sharing a database with your team

The embedded Postgres is per-laptop — fine for solo work, useless if
you want teammates to see the same products, sprints, issues, and
agents. Point Softclip at a shared Postgres (a local Docker instance,
a managed cloud Postgres, or a server on your network):

```sh
softclip db connect
softclip db doctor
```

See [Team-shared PostgreSQL](./team-postgres.md) for the full walkthrough.

## What's Next

Once Softclip is running:

1. Create your first **product** in the web UI — it lands with a Product Owner already hired and the five default ceremonies (standup, planning, review, retro, grooming) assigned to them.
2. Write a **roadmap item** describing what you're trying to build.
3. Break it into **issues** with acceptance criteria.
4. Group issues into a **sprint** with a one-sentence goal.
5. Hire an Engineer, configure its adapter, and hit go — it picks up an assigned issue on the next heartbeat.
6. When the Engineer opens a PR, a code review lands in your inbox.

<Card title="Core Concepts" href="/start/core-concepts">
  Learn the key concepts behind Softclip
</Card>

