<p align="center">
  <img src="doc/assets/header.png" alt="Softclip — orchestrate an AI software dev team" width="720" />
</p>

<p align="center">
  <a href="#quickstart"><strong>Quickstart</strong></a> &middot;
  <a href="https://paperclip.ing/docs"><strong>Docs</strong></a> &middot;
  <a href="https://github.com/paperclipai/paperclip"><strong>GitHub</strong></a> &middot;
  <a href="https://discord.gg/m4HZY7xNG3"><strong>Discord</strong></a>
</p>

<p align="center">
  <a href="https://github.com/paperclipai/paperclip/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://github.com/paperclipai/paperclip/stargazers"><img src="https://img.shields.io/github/stars/paperclipai/paperclip?style=flat" alt="Stars" /></a>
  <a href="https://discord.gg/m4HZY7xNG3"><img src="https://img.shields.io/discord/000000000?label=discord" alt="Discord" /></a>
</p>

<br/>

> **Softclip (formerly Paperclip).** This repo is being pivoted from a general-purpose
> AI-company control plane into a software-development-team platform. The code-level
> identifiers (`paperclipai` CLI, `@paperclipai/*` npm scope, URLs) still carry the
> Paperclip name while the rename is in progress; the product you get is Softclip.

<br/>

## What is Softclip?

# Open-source orchestration for AI software development teams

**If your AI agent is a _developer_, Softclip is the _dev team they work on_**

Softclip is a Node.js server and React UI that orchestrates a team of AI agents to
ship software. Bring your own agents, organise them as a Product Owner + architects
+ designer + engineer + QA, and watch real work move through sprints, PR reviews,
and Definition of Done — not a pile of loose Claude Code tabs.

It looks like a project tracker — but under the hood it has a Product Owner that
prioritises the roadmap, sprint iterations with a state machine, acceptance
criteria that gate every close, code / design / architecture reviews, ceremonies,
and a dev-team org chart.

**Manage what gets built and why — not which tab you left Claude Code in.**

|        | Step                | Example                                                                         |
| ------ | ------------------- | ------------------------------------------------------------------------------- |
| **01** | Scaffold the team   | `npx paperclipai product-creator` — PO + architects + designer + engineer + QA  |
| **02** | Point at your repo  | Wire in Claude Code, Codex, Cursor, or any agent that can receive a heartbeat   |
| **03** | Plan the sprint     | PO drafts the roadmap, writes acceptance criteria, commits issues to a sprint   |
| **04** | Ship                | Engineer implements, QA verifies DoD, PO approves the PR review — issue closes  |

<br/>

> **COMING SOON: Clipmart** — Download and run pre-built AI dev teams with one
> click. Browse team templates — full rosters, role prompts, and skills — and
> import them into your Softclip instance in seconds.

<br/>

<div align="center">
<table>
  <tr>
    <td align="center"><strong>Works<br/>with</strong></td>
    <td align="center"><img src="doc/assets/logos/openclaw.svg" width="32" alt="OpenClaw" /><br/><sub>OpenClaw</sub></td>
    <td align="center"><img src="doc/assets/logos/claude.svg" width="32" alt="Claude" /><br/><sub>Claude Code</sub></td>
    <td align="center"><img src="doc/assets/logos/codex.svg" width="32" alt="Codex" /><br/><sub>Codex</sub></td>
    <td align="center"><img src="doc/assets/logos/cursor.svg" width="32" alt="Cursor" /><br/><sub>Cursor</sub></td>
    <td align="center"><img src="doc/assets/logos/bash.svg" width="32" alt="Bash" /><br/><sub>Bash</sub></td>
    <td align="center"><img src="doc/assets/logos/http.svg" width="32" alt="HTTP" /><br/><sub>HTTP</sub></td>
  </tr>
</table>

<em>If it can receive a heartbeat, it's hired.</em>

</div>

<br/>

## Softclip is right for you if

- ✅ You want a **sprint-driven AI dev team** with a real Product Owner, not a single loose coding agent
- ✅ You **run multiple coding agents** (Claude Code, Codex, Cursor, OpenClaw) and want them to share a backlog, a roadmap, and a review flow
- ✅ You have **20 simultaneous Claude Code terminals** open and lose track of which one is shipping what
- ✅ You want agents running **autonomously 24/7** but gated by **acceptance criteria** and **code reviews** — not a free-for-all
- ✅ You share a **dev team across human collaborators** and want one Postgres-backed source of truth
- ✅ You want work managed the way software teams actually work: sprints, acceptance criteria, DoD, ceremonies, code review

<br/>

## Features

<table>
<tr>
<td align="center" width="33%">
<h3>🧩 Bring Your Own Agent</h3>
Any agent, any runtime, one dev team. If it can receive a heartbeat, it's on the roster.
</td>
<td align="center" width="33%">
<h3>🗺️ Roadmap-Anchored</h3>
Every issue ladders up to a roadmap item. Agents can answer "why am I building this?"
</td>
<td align="center" width="33%">
<h3>🏃 Sprints</h3>
Time-boxed iterations with a goal, a committed set, and a burndown.
</td>
</tr>
<tr>
<td align="center">
<h3>✅ Acceptance Criteria</h3>
Every issue carries a testable checklist. Closing is refused until each criterion is met or waived.
</td>
<td align="center">
<h3>🔍 Code Reviews</h3>
Request PR, design, or architecture review with one API call. Reviews gate closure.
</td>
<td align="center">
<h3>🎤 Ceremonies</h3>
Standup, planning, retro, review, grooming — seeded with substantive prompts, not placeholders.
</td>
</tr>
<tr>
<td align="center">
<h3>👥 Dev-Team Roster</h3>
PO at the root; software / solution / data architects, designer, engineer, QA reporting in.
</td>
<td align="center">
<h3>🗄️ Team Postgres</h3>
<code>softclip db connect</code> points the whole team at a shared Postgres in one command.
</td>
<td align="center">
<h3>📖 Authored Role Prompts</h3>
Each default role ships with a README, AGENTS, HEARTBEAT, SOUL, TOOLS bundle — editable and traceable.
</td>
</tr>
</table>

<br/>

## Problems Softclip solves

| Without Softclip                                                                                                      | With Softclip                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| ❌ You have 20 Claude Code tabs open and can't track which one does what. On reboot you lose everything.              | ✅ Issues live in sprints. Conversations are threaded. Sessions persist across reboots.                                                      |
| ❌ Your coding agent ships half a feature because nobody wrote down what "done" means.                                | ✅ Acceptance criteria are authored by the PO before an issue reaches Engineer. Close is refused while any criterion is still pending.       |
| ❌ Review feedback gets lost in Slack threads next to what the agent actually shipped.                                | ✅ Code, design, and architecture reviews are first-class approvals linked to the issue.                                                     |
| ❌ Folders of agent configs rot and you re-invent task management, delegation, and hand-off between agents.           | ✅ Softclip ships a seven-role default team with authored prompts; product-creator scaffolds the package in one conversation.                |
| ❌ Sprints and ceremonies live in Slack reminders and one person's calendar.                                          | ✅ Ceremonies are seeded as first-class routines; sprints are a primitive with a state machine and a burndown.                               |
| ❌ Two collaborators see different data because each runs an embedded DB.                                             | ✅ <code>softclip db connect</code> points everyone at the same team Postgres. <code>softclip db doctor</code> reports drift.                |

<br/>

## Why Softclip is special

Softclip handles the hard orchestration details correctly.

|                                     |                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Atomic execution.**               | Task checkout and state transitions are atomic, so no double-work and no lost updates.                                                   |
| **Persistent agent state.**         | Agents resume the same task context across heartbeats instead of restarting from scratch.                                                |
| **Runtime skill injection.**        | Agents learn Softclip workflows and project context at runtime, without retraining.                                                      |
| **Governance with rollback.**       | Approval gates are enforced, config changes are revisioned, and bad changes can be rolled back safely.                                   |
| **Roadmap-aware execution.**        | Issues carry a full roadmap-item ancestry so agents consistently see the "why," not just a title.                                        |
| **Portable team templates.**        | Export/import agents with skills and adapter config; <code>agentcompanies/v1</code> packages are round-trippable.                        |
| **True multi-product isolation.**   | Every entity is product-scoped, so one deployment can run many products with separate data and audit trails.                             |
| **Sprint-aware close-guard.**       | An issue closes only when every acceptance criterion is met or explicitly waived — both in the API and behind the UI.                   |

<br/>

## What Softclip is not

|                                 |                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Not a chatbot.**              | Agents have jobs, not chat windows.                                                                                      |
| **Not an agent framework.**     | We don't tell you how to build agents. We tell you how to run a dev team made of them.                                   |
| **Not a workflow builder.**     | No drag-and-drop pipelines. Softclip models dev teams — roadmap, sprints, issues, reviews, ceremonies.                   |
| **Not a prompt manager.**       | Agents bring their own prompts, models, and runtimes. Softclip manages the team they work in.                            |
| **Not a single-agent tool.**    | This is for teams. If you have one coding agent, you probably don't need Softclip. If you have five — you definitely do. |
| **Not a Jira replacement.**     | Softclip is narrower and more opinionated. It's tuned for AI dev teams, not 200-person engineering orgs.                 |

<br/>

## Quickstart

Open source. Self-hosted. No Softclip account required.

```bash
npx paperclipai onboard --yes
```

That quickstart path defaults to trusted local loopback mode for the fastest first run.
To start in authenticated/private mode instead, choose a bind preset explicitly:

```bash
npx paperclipai onboard --yes --bind lan
# or:
npx paperclipai onboard --yes --bind tailnet
```

If you already have Softclip configured, rerunning `onboard` keeps the existing config in place.
Use `paperclipai configure` to edit settings.

Point Softclip at a team-shared Postgres (see [docs/start/team-postgres.md](docs/start/team-postgres.md)):

```bash
paperclipai db connect          # interactive — or pass --url for non-interactive
paperclipai db doctor           # verify migrations, row counts, privileges
```

Or manually:

```bash
git clone https://github.com/paperclipai/paperclip.git
cd paperclip
pnpm install
pnpm dev
```

This starts the API server at `http://localhost:3100`. An embedded PostgreSQL database
is created automatically — no setup required.

> **Requirements:** Node.js 20+, pnpm 9.15+

<br/>

## FAQ

**What does a typical setup look like?**
Locally, a single Node.js process manages an embedded Postgres and local file storage.
For a shared team setup, point it at your own Postgres (see `softclip db connect`)
and deploy however you like.

**Can I run multiple products?**
Yes. A single deployment can run an unlimited number of products (teams) with complete
data isolation.

**How is Softclip different from Claude Code / Cursor / Codex?**
Softclip _uses_ those agents. It orchestrates them into a dev team — with a Product
Owner, architects, engineers, QA, sprints, acceptance criteria, and code reviews.

**Why not just point my coding agent at GitHub Issues?**
Agent orchestration has subtleties: who owns a task, how sessions persist, how
acceptance criteria enforce "done", how reviews gate close. GitHub Issues doesn't
do any of that for AI dev teams. Softclip does.

**Do agents run continuously?**
By default, agents run on scheduled heartbeats and event-based triggers (task
assignment, @-mentions, approval resolution). You can also hook in continuous
agents like OpenClaw.

**Can I start from an existing repo?**
Yes. Run the `product-creator` skill against a repo URL and it will analyse the
language, framework, CI, and existing `AGENTS.md` / `.claude/` config, then propose
a dev-team roster that fits.

<br/>

## Development

```bash
pnpm dev              # Full dev (API + UI, watch mode)
pnpm dev:once         # Full dev without file watching
pnpm dev:server       # Server only
pnpm build            # Build all
pnpm typecheck        # Type checking
pnpm test             # Cheap default test run (Vitest only)
pnpm test:watch       # Vitest watch mode
pnpm test:e2e         # Playwright browser suite
pnpm db:generate      # Generate DB migration
pnpm db:migrate       # Apply migrations
```

`pnpm test` does not run Playwright. Browser suites stay separate and are typically
run only when working on those flows or in CI.

See [doc/DEVELOPING.md](doc/DEVELOPING.md) for the full development guide.

<br/>

## Roadmap

- ✅ Dev-team role bundles (PO, architects, designer, engineer, QA) with authored prompts
- ✅ Product-creator skill — scaffold a dev team from scratch or from a repo
- ✅ Sprints with state machine + burndown
- ✅ Acceptance criteria + Definition of Done close-guard
- ✅ Code / design / architecture reviews as first-class approvals
- ✅ Seeded dev-team ceremonies (standup, planning, review, retro, grooming)
- ✅ Team-shared Postgres (`softclip db connect` / `db doctor`)
- ⚪ UI for acceptance criteria, sprints, reviews
- ⚪ Full Paperclip → Softclip code rename (package names, DB tables)
- ⚪ Drop budgets / finance / company governance (dev teams don't need dollar-budgets)
- ⚪ Cloud / Sandbox agents (e.g. Cursor / e2b agents)
- ⚪ Artifacts & Work Products
- ⚪ Memory / Knowledge

This is the short roadmap preview. See the full pivot plan in the branch commit history.

<br/>

## Community & Plugins

Find Plugins and more at [awesome-paperclip](https://github.com/gsxdsm/awesome-paperclip)

## Telemetry

Softclip collects anonymous usage telemetry to help us understand how the product
is used and improve it. No personal information, issue content, prompts, file
paths, or secrets are ever collected.

Telemetry is **enabled by default** and can be disabled with any of the following:

| Method               | How                                                     |
| -------------------- | ------------------------------------------------------- |
| Environment variable | `PAPERCLIP_TELEMETRY_DISABLED=1`                        |
| Standard convention  | `DO_NOT_TRACK=1`                                        |
| CI environments      | Automatically disabled when `CI=true`                   |
| Config file          | Set `telemetry.enabled: false` in your Softclip config  |

## Contributing

We welcome contributions. See the [contributing guide](CONTRIBUTING.md) for details.

<br/>

## Community

- [Discord](https://discord.gg/m4HZY7xNG3) — Join the community
- [GitHub Issues](https://github.com/paperclipai/paperclip/issues) — bugs and feature requests
- [GitHub Discussions](https://github.com/paperclipai/paperclip/discussions) — ideas and RFC

<br/>

## License

MIT &copy; 2026 Softclip contributors

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=paperclipai/paperclip&type=date&legend=top-left)](https://www.star-history.com/?repos=paperclipai%2Fpaperclip&type=date&legend=top-left)

<br/>

---

<p align="center">
  <img src="doc/assets/footer.jpg" alt="" width="720" />
</p>
