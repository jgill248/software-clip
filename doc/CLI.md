# CLI Reference

Softclip CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm softclip --help
```

First-time local bootstrap + run:

```sh
pnpm softclip run
```

Choose local instance:

```sh
pnpm softclip run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `softclip onboard` and `softclip configure --section server` set deployment mode in config
- server onboarding/configure ask for reachability intent and write `server.bind`
- `softclip run --bind <loopback|lan|tailnet>` passes a quickstart bind preset into first-run onboarding when config is missing
- runtime can override mode with `SOFTCLIP_DEPLOYMENT_MODE`
- `softclip run` and `softclip doctor` still do not expose a direct low-level `--mode` flag

Canonical behavior is documented in `doc/DEPLOYMENT-MODES.md`.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm softclip allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.softclip`:

```sh
pnpm softclip run --data-dir ./tmp/softclip-dev
pnpm softclip issue list --data-dir ./tmp/softclip-dev
```

## Context Profiles

Store local defaults in `~/.softclip/context.json`:

```sh
pnpm softclip context set --api-base http://localhost:3100 --company-id <company-id>
pnpm softclip context show
pnpm softclip context list
pnpm softclip context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm softclip context set --api-key-env-var-name SOFTCLIP_API_KEY
export SOFTCLIP_API_KEY=...
```

## Company Commands

```sh
pnpm softclip company list
pnpm softclip company get <company-id>
pnpm softclip company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm softclip company delete PAP --yes --confirm PAP
pnpm softclip company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `SOFTCLIP_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `SOFTCLIP_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm softclip issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm softclip issue get <issue-id-or-identifier>
pnpm softclip issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm softclip issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm softclip issue comment <issue-id> --body "..." [--reopen]
pnpm softclip issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm softclip issue release <issue-id>
```

## Agent Commands

```sh
pnpm softclip agent list --company-id <company-id>
pnpm softclip agent get <agent-id>
pnpm softclip agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Softclip agent:

- creates a new long-lived agent API key
- installs missing Softclip skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `SOFTCLIP_API_URL`, `SOFTCLIP_COMPANY_ID`, `SOFTCLIP_AGENT_ID`, and `SOFTCLIP_API_KEY`

Example for shortname-based local setup:

```sh
pnpm softclip agent local-cli codexcoder --company-id <company-id>
pnpm softclip agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm softclip approval list --company-id <company-id> [--status pending]
pnpm softclip approval get <approval-id>
pnpm softclip approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm softclip approval approve <approval-id> [--decision-note "..."]
pnpm softclip approval reject <approval-id> [--decision-note "..."]
pnpm softclip approval request-revision <approval-id> [--decision-note "..."]
pnpm softclip approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm softclip approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm softclip activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm softclip dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm softclip heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.softclip/instances/default`:

- config: `~/.softclip/instances/default/config.json`
- embedded db: `~/.softclip/instances/default/db`
- logs: `~/.softclip/instances/default/logs`
- storage: `~/.softclip/instances/default/data/storage`
- secrets key: `~/.softclip/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
SOFTCLIP_HOME=/custom/home SOFTCLIP_INSTANCE_ID=dev pnpm softclip run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm softclip configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
