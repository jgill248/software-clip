---
name: product-creator
description: >
  Scaffold an agent-driven software development team as an agentcompanies/v1
  package. Use when a user wants to stand up a new AI dev team from scratch,
  wrap an existing code repo in a dev-team structure, or generate the files
  that will be imported into a Softclip product. Triggers on: "create a
  product", "scaffold a dev team", "spin up an AI dev team", "turn this repo
  into an agent team", "hire a product team". Do NOT use for importing an
  existing package (use the CLI import command) or for modifying a product
  that is already running in Softclip.
---

# Product Creator

Scaffold an agent-driven software development team conforming to the Agent
Companies specification (`agentcompanies/v1`). The output is a portable
package — COMPANY.md plus agents, teams, projects, skills — that a developer
can version-control, share with their human team, and import into Softclip.

> The spec uses the filename `COMPANY.md` as the root entrypoint; that name
> is external and cannot change. Everywhere else in the vocabulary you use
> with the user (roles, workflow, language), lean into the software
> development framing — not business/corporate framing.

## When to use this skill

Use it for any request framed around *"set up an AI team to build
software"*. Common triggers:

- "Scaffold a product team for this repo"
- "I want a Product Owner + a couple of engineers + QA"
- "Turn this open-source repo into an agent dev team"
- "Give me a starter AI squad for a side project"

Do not use it for:

- Importing a package that already exists (use `softclip product import`
  once that CLI lands, or the current `softclip company import`).
- Changing an already-running Softclip product (edit it in the UI or via
  API instead).
- Generating a non-software team (marketing-only, research-only) — those
  still fit agentcompanies/v1, but this skill's opinions are tuned for
  software dev specifically.

## Modes

### Mode 1 — From scratch

The user describes what they want. Interview briefly, propose a roster,
generate the package.

### Mode 2 — From a repo

The user points at a git repo. Clone it, analyse language/frameworks/CI,
propose a team that fits the repo, generate the package. See
[`references/from-repo-guide.md`](references/from-repo-guide.md) for the
analysis checklist.

## Process

### Step 1 — Gather context

Determine the mode.

- **From scratch:** What kind of software? What's the roadmap for the next
  quarter?
- **From repo:** `git clone` (or read local). Scan `README.md`,
  `package.json`/`pyproject.toml`/`Cargo.toml`, `.github/workflows/`,
  existing `AGENTS.md`/`CLAUDE.md`, `.claude/skills/`. Note the primary
  language, the test framework, the CI setup, and any existing agent
  configuration.

### Step 2 — Interview (use AskUserQuestion)

Do not skip this step. Keep it short — 2–3 questions per round. You are
aligning, not surveying.

**For from-scratch products**, ask:

- Product purpose and target user (1–2 sentences).
- Which default team fits: **Starter** (PO + Engineer + QA), **Standard**
  (PO + Software Architect + Designer + Engineer + QA), or **Full**
  (adds Solution Architect and Data Architect). See
  [`references/default-dev-team.md`](references/default-dev-team.md) for
  the roster definitions.
- The primary workflow pattern (see *Workflow* below) — propose one based
  on the product description; ask to confirm.

**For from-repo products**, present your analysis and ask:

- Confirm the proposed roster based on the repo's shape (e.g., a
  back-end-only Go repo probably doesn't need a Designer; a frontend
  monorepo probably does).
- Whether to reference or vendor any skills you found (default:
  reference).
- Product name (default: the repo name).
- Confirm the workflow you inferred.

**Interviewing principles:**

- **Propose a concrete roster** using
  [`references/default-dev-team.md`](references/default-dev-team.md).
  Don't ask open-ended "what agents do you want?" — offer a named default
  and let the user adjust.
- **Keep rosters lean.** Starter (3 agents) is right for most side
  projects; Standard (5) for small teams shipping a real product; Full
  (7) only when schema design, integrations, or UX complexity clearly
  warrant the extra seats.
- **Always include a Product Owner.** PO is the root agent
  (`reportsTo: null`). Without one, there's no single owner of "what gets
  built and why."
- **Everyone reports to the PO by default.** A flat roster-under-PO is
  the right starting structure; add intermediate managers only when the
  team grows past 6.

### Step 3 — Workflow

The package is not a list of agents; it's a team that *actually ships
software*. Every agent's instructions need to state:

- Where their work comes from (PO assignment? Inbound bug? Sprint ticket?)
- What they produce (code + tests? design doc? approved PR?)
- Who they hand off to and what the handoff looks like
- What "done" means for their role

Pick the workflow pattern that fits the product:

- **Sprint-driven (default)** — PO plans sprints, writes acceptance
  criteria; Engineer implements against sprint tickets; QA verifies
  Definition of Done; Architect/Designer feed in as needed. Good for
  almost any product dev team.
- **Pipeline** — sequential stages (e.g., idea → design → build → test
  → ship). Use when the domain has strict ordering (regulated industries,
  release-train projects).
- **On-demand** — agents are summoned by the user, no fixed flow. Use
  for internal-tool or tinkering setups where the user drives every
  invocation.
- **Hub-and-spoke** — PO delegates to specialists who work independently
  without handing off to each other. Use for research/exploration teams
  where each agent answers a distinct question.

If none of these fits cleanly, propose a pattern in the interview and
let the user confirm.

### Step 4 — Read the spec and roster reference

Before writing files, read:

- [`references/companies-spec.md`](references/companies-spec.md) — quick
  reference for the agentcompanies/v1 schema.
- [`references/default-dev-team.md`](references/default-dev-team.md) —
  the roster definitions and each role's source-of-truth instruction
  bundle.
- [`references/example-dev-team.md`](references/example-dev-team.md) —
  a worked example package end-to-end.
- The normative spec (if present locally): `docs/companies/companies-spec.md`.

### Step 5 — Generate the package

**Directory structure:**

```
<product-slug>/
├── COMPANY.md                   (spec-mandated filename; "the product")
├── agents/
│   ├── product-owner/AGENTS.md
│   ├── software-architect/AGENTS.md   (Standard / Full)
│   ├── solution-architect/AGENTS.md   (Full)
│   ├── data-architect/AGENTS.md       (Full)
│   ├── designer/AGENTS.md             (Standard / Full)
│   ├── engineer/AGENTS.md
│   └── qa/AGENTS.md
├── teams/
│   └── dev-team/TEAM.md         (optional; wraps the whole roster)
├── projects/
│   └── <slug>/PROJECT.md        (if the user wants an initial project)
├── tasks/
│   └── <slug>/TASK.md           (if the user wants starter sprint tasks)
├── skills/
│   └── <slug>/SKILL.md          (custom skills only; reference built-ins)
├── .softclip.yaml              (optional vendor extension)
├── README.md
└── LICENSE
```

**Rules:**

- Slugs are URL-safe, lowercase, hyphenated.
- `schema: agentcompanies/v1` goes in `COMPANY.md`; other files inherit
  it.
- Agent instructions live in the AGENTS.md body; not in `.softclip.yaml`.
- Skills referenced by shortname in AGENTS.md resolve to
  `skills/<shortname>/SKILL.md`. For external skills, use `sources` with
  `usage: referenced`.
- Do not export secrets, machine-local paths, or database IDs. Omit
  empty/default fields.

**Reporting structure:**

- Product Owner → `reportsTo: null`.
- Everyone else → `reportsTo: product-owner` by default.
- If you need an intermediate manager (team > 6), wire them in, but
  flag it in the README so the user can flatten if they prefer.

**Sourcing the AGENTS.md bodies:**

The `server/src/onboarding-assets/<role>/` directories in the Softclip
repo are the canonical, hand-authored instructions for each role. When
generating an AGENTS.md for a default role:

1. Start from the body of `server/src/onboarding-assets/<role>/AGENTS.md`.
2. Tailor one paragraph to the specific product (what this product does,
   what this role uniquely owns on *this* team).
3. Leave HEARTBEAT.md / SOUL.md / TOOLS.md references in place — if the
   user runs Softclip, those files will be merged in by the platform.

For custom roles (e.g., "ML Engineer" that isn't in the default roster),
copy the `_template/` bundle and fill it in.

### Step 6 — Confirm output location

Common choices:

- A new subdirectory in the current working directory.
- A path the user specifies.
- A fresh empty directory.

Default to `./<product-slug>/`.

### Step 7 — README.md and LICENSE

**README.md** should make a human browsing GitHub understand the package
in 60 seconds. Include:

- Product name, one-sentence what-it-does.
- Workflow pattern and what ships out of one sprint.
- Roster as a markdown table: role, reports-to, primary responsibility.
- Skills: custom + referenced.
- Getting started: `softclip company import --from <path>` (rename to
  `product import` when available).
- Citations: source repo (from-repo), agentcompanies spec link
  (https://agentcompanies.io/specification), Softclip repo link.

**LICENSE** goes alongside. Copyright holder is the user creating the
package. License defaults to MIT unless the source repo or the user
specifies otherwise.

### Step 8 — Write and summarise

After writing all files, give the user a terse summary:

- Product name and one-sentence description.
- Roster (bullet list: role → reports-to).
- Skills included (custom + referenced).
- Projects / starter tasks if any.
- Output path.
- Exact next command: `softclip company import --from <path>`.

## `.softclip.yaml` guidelines

The `.softclip.yaml` file is Softclip's vendor extension to the spec.
Use it for adapter preferences and env-input declarations — nothing else.

**Do not specify an adapter unless the repo/user context genuinely calls
for one.** Unknown adapter types cause import errors. Supported values:

- `claude_local` — Claude Code CLI
- `codex_local` — Codex CLI
- `opencode_local` — OpenCode CLI
- `pi_local` — Pi CLI
- `cursor` — Cursor
- `gemini_local` — Gemini CLI
- `openclaw_gateway` — OpenClaw gateway

Set an adapter only when:

- The repo or its skills clearly target a specific runtime.
- The user explicitly requests one.
- The role requires a specific runtime capability.

**Env inputs:** only declare variables the agent actually needs. Common
cases:

- `GH_TOKEN` for agents that open PRs or read/write GitHub (usually
  Engineer and occasionally QA).
- Vendor API keys only when a skill explicitly needs them.
- Never add `ANTHROPIC_API_KEY` — the runtime handles it.

Agents with no overrides do not appear in `.softclip.yaml` at all.

## External skill references

When referencing skills from a GitHub repo:

```yaml
metadata:
  sources:
    - kind: github-file
      repo: owner/repo
      path: path/to/SKILL.md
      commit: <full SHA from git ls-remote>
      attribution: Owner or Org Name
      license: <from the repo's LICENSE>
      usage: referenced
```

Get the SHA with:

```bash
git ls-remote https://github.com/owner/repo HEAD
```

Do **not** copy external skill content into the package unless the user
explicitly asks.

## Quality bar

A product package is "done" when:

- [ ] `COMPANY.md` has the four required fields (name, description,
      slug, schema).
- [ ] Every agent has a Product Owner upstream (`reportsTo` eventually
      reaches PO or is PO itself).
- [ ] Every AGENTS.md body is substantive — scope, delegation, non-goals,
      escalation, artifacts owned. No one-liner roles. (If you started
      from `onboarding-assets/<role>/` you already pass this bar.)
- [ ] The workflow is stated, either in `COMPANY.md` or in `README.md`.
- [ ] README.md reads well to a human new to the package.
- [ ] LICENSE is present.
- [ ] No secrets, no absolute machine paths, no DB IDs.

If any of those fail, the package isn't ready to ship.
