# Scaffolding a Dev Team From an Existing Repo

When a user points product-creator at a git repo (URL, local path, or a
tweet linking to one), analyse the repo and generate a package that
fits *this specific codebase* — not a generic team template.

## 1. Clone or read

- URL → `git clone --depth 1 <url> /tmp/product-creator-<random>`.
- Local path → read in place.
- Tweet / link → extract the repo URL, then clone.

## 2. Read the shape of the repo

Work through, in order:

| Source                              | What you learn                                         |
| ----------------------------------- | ------------------------------------------------------ |
| `README.md`                         | Purpose, entry point, intended user                    |
| `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` | Language, framework, test runner, scripts |
| `.github/workflows/`                | CI shape: what runs on PR, what gates merge            |
| `docs/` or `doc/`                   | Architecture, ADRs, design docs                        |
| `server/` vs `ui/` vs `packages/`   | Monorepo shape; which concerns are in play             |
| `AGENTS.md`, `CLAUDE.md`, `.claude/`| Existing agent conventions — respect them              |

Write down, before proposing a roster:

- **Primary language(s).** (Node/TypeScript, Python, Go, Rust, etc.)
- **Frontend or backend-only.** (Does the repo render a UI?)
- **Framework(s).** (React, Next, Django, Express, etc.)
- **Test framework.** (Vitest, Jest, pytest, cargo test, Playwright for
  e2e, etc.)
- **CI hosting.** (GitHub Actions, CircleCI, none.)
- **Data model surface.** (Any ORM? Any migrations folder?)
- **External integrations.** (Any `integrations/` folder? Any obvious
  third-party SDKs imported?)

## 3. Propose a roster

Map the repo's shape to a roster preset from
[`default-dev-team.md`](default-dev-team.md).

### Heuristics

| Observation                                                   | Implies                              |
| ------------------------------------------------------------- | ------------------------------------ |
| Pure CLI / library, no UI                                     | Starter or Standard **minus Designer** |
| React / UI-heavy frontend                                     | Keep Designer                        |
| Multiple external integrations (webhooks, OAuth, SaaS SDKs)   | Full (for Solution Architect)        |
| Obvious DB migrations folder, > 10 tables                     | Full (for Data Architect)            |
| Small monorepo, single service, no UI                         | Starter                              |
| Rich e2e test dir (`tests/e2e`, Playwright), release-smoke    | Keep QA even in a tiny roster        |
| CI has security-scan or codeql step                           | Mention it in QA's instructions      |

### Product Owner is always required

Regardless of repo shape, the package gets a Product Owner. Without
one, no one owns "what we ship next." Size the rest of the roster to
the repo.

## 4. Respect pre-existing agent configs

If you find any of:

- `AGENTS.md` at the repo root
- `CLAUDE.md` or `.claude/` directories
- Existing `skills/` collections
- `.codex/` or `codex/` configs

then:

- **Use them as material** for AGENTS.md bodies. Don't copy verbatim;
  adapt to the role-specific structure from
  `server/src/onboarding-assets/<role>/AGENTS.md`.
- **Preserve the intent.** If the original AGENTS.md says "always run
  `pnpm typecheck` before opening a PR," make sure the Engineer's
  HEARTBEAT step includes that.
- **Reference, don't vendor, discovered skills.** Use
  `usage: referenced` in `sources`. See the main SKILL.md for the exact
  source-reference syntax.

## 5. Map adapter when obvious

Only set an adapter in `.paperclip.yaml` when the repo signals one:

- `.claude/` directory / `CLAUDE.md` → `claude_local`
- `codex/` / `.codex/` config → `codex_local`
- `cursor/` config or `.cursor/` / `.cursorrules` → `cursor`
- OpenClaw-specific skills → `openclaw_gateway`

When the repo doesn't signal, **omit the adapter block** and let
Paperclip pick the default. An unknown adapter type causes import
errors.

## 6. Infer env inputs

Scan the repo's CI and docs for required env vars, then declare only
the ones an agent will actually use:

- If PRs are opened by the team or skills touch GitHub → Engineer gets
  `GH_TOKEN`.
- If CI requires a vendor secret (e.g. `DEPLOY_TOKEN`) and a role would
  trigger that workflow → add it to that role.
- Do **not** declare every env var from `.env.example`. Only the ones
  an agent needs on its heartbeat.

## 7. Workflow inference

| Repo shape                                                    | Default workflow pattern               |
| ------------------------------------------------------------- | -------------------------------------- |
| Active product dev, sprints implied (issues + PRs flowing)    | **Sprint-driven**                      |
| Release-train repo (every-two-week tags, hotfix branches)     | **Pipeline**                           |
| Tool / utility repo, user drives invocation                    | **On-demand**                          |
| Research / notebooks, independent analyses                    | **Hub-and-spoke**                      |

State the inferred pattern in the interview. The user will often
refine it — that's expected.

## 8. Name the product

Default to the repo name (lowercased, hyphenated). If the repo name is
generic (`foo-app`, `my-project`), ask the user for a better one
during the interview.

## 9. README.md for from-repo packages

Include, in addition to the standard sections:

- **Source attribution.** *"Generated from [owner/repo](url) with the
  product-creator skill from [Softclip](https://github.com/paperclipai/paperclip)."*
- **What the source repo does**, in one paragraph (drawn from the
  repo's README).
- **What this package adds on top** — the dev team + its workflow.
