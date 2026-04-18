---
title: Team-shared PostgreSQL
summary: Point Paperclip at a Postgres instance your whole team uses
---

By default, Paperclip runs an embedded PostgreSQL on your laptop — great
for solo use, useless for coordinating with teammates. If your dev team
already has a shared Postgres (a local Docker instance, a managed cloud
Postgres, or a server on your network), you can point Paperclip at it
so every teammate's CLI sees the same products, sprints, issues, and
agents.

## Prerequisites

- A reachable PostgreSQL 14 or newer.
- A database role with **CREATE** privilege on the target database (needed
  so migrations can add tables). A role with ownership of the database is
  simplest.
- A dedicated database — don't share the schema with unrelated app data.

## One-step connect

```bash
paperclipai db connect
```

You'll be prompted for either a full connection string or the parts
(host, port, database, user, password). The command:

1. Tests the connection.
2. Verifies the connected user has `CREATE` privilege.
3. Warns if the target database already has tables (in case you picked
   the wrong database).
4. Writes the URL into your Paperclip config.
5. Offers to run migrations immediately.

### Non-interactive

For scripts and CI:

```bash
paperclipai db connect \
  --url 'postgres://softclip:secret@db.team.internal:5432/softclip' \
  --yes
```

or with explicit parts:

```bash
paperclipai db connect \
  --host db.team.internal \
  --port 5432 \
  --database softclip \
  --user softclip \
  --password "$PGPASSWORD" \
  --yes
```

`--yes` accepts the "switch from embedded" confirmation and runs
migrations. Add `--skip-migrate` if you want to apply migrations out of
band.

## Verify

After connecting, run:

```bash
paperclipai db doctor
```

You'll see:

```
Connection
  source:  config.database.connectionString
  version: PostgreSQL 16.3 ...

Migrations
  up to date (57 applied, 104 tables)

Rows
  companies  1
  agents     4
  issues     38
  invites    0
```

`db doctor` exits non-zero when:

- migrations are pending (exit code `1`),
- the configured user lacks `CREATE` privilege (exit code `1`),
- the connection fails (exit code `2`).

That makes it safe to gate a CI job on `paperclipai db doctor --json`.

## What to share across your team

Everyone on the team needs:

- The same **connection string** (or the same host + credentials for their
  own role).
- The same Paperclip version — different versions may expect different
  migrations.

Everyone keeps **separate local config** otherwise (their own instance
id, their own auth session). Only the database is shared.

## A local Postgres in Docker, quick

If you don't have a shared Postgres yet and just want to test this path
with something other than embedded:

```bash
docker run --name softclip-pg \
  -e POSTGRES_USER=softclip \
  -e POSTGRES_PASSWORD=softclip \
  -e POSTGRES_DB=softclip \
  -p 5432:5432 \
  -d postgres:16

paperclipai db connect \
  --url 'postgres://softclip:softclip@localhost:5432/softclip' \
  --yes
```

Tear it down with `docker rm -f softclip-pg` when you're done.

## Going back to embedded

If you want to revert to the built-in embedded Postgres, run the
configuration wizard and pick `embedded-postgres` mode:

```bash
paperclipai configure --section database
```

## Troubleshooting

- **`password authentication failed`** — the user/password are wrong, or
  the user isn't permitted from your host in `pg_hba.conf`.
- **`database "softclip" does not exist`** — create it first:
  `CREATE DATABASE softclip OWNER softclip;`
- **`permission denied to create extension`** — the connected user lacks
  privileges Drizzle migrations need. Grant `CREATE` on the database or
  use the database owner.
- **`db doctor` reports `needs migrations`** — run `pnpm db:migrate`
  (development) or `paperclipai db connect --yes` (re-runs the migrator).
- **Two teammates see different data** — double-check both point at the
  same `connectionString`; run `paperclipai db doctor` on each to
  compare the `source` line.
