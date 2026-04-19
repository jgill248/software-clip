---
title: CLI Overview
summary: CLI installation and setup
---

The Softclip CLI handles instance setup, diagnostics, and control-plane operations. It is also available under the legacy `softclip` name during the rename.

## Usage

```sh
pnpm softclip --help
```

## Global Options

All commands support:

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | Local Softclip data root (isolates from `~/.softclip`) |
| `--api-base <url>` | API base URL |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output as JSON |

Company-scoped commands also accept `--company-id <id>`.

For clean local instances, pass `--data-dir` on the command you run:

```sh
pnpm softclip run --data-dir ./tmp/softclip-dev
```

## Context Profiles

Store defaults to avoid repeating flags:

```sh
# Set defaults
pnpm softclip context set --api-base http://localhost:3100 --company-id <id>

# View current context
pnpm softclip context show

# List profiles
pnpm softclip context list

# Switch profile
pnpm softclip context use default
```

To avoid storing secrets in context, use an env var:

```sh
pnpm softclip context set --api-key-env-var-name SOFTCLIP_API_KEY
export SOFTCLIP_API_KEY=...
```

Context is stored at `~/.softclip/context.json`.

## Command Categories

The CLI has two categories:

1. **[Setup commands](/cli/setup-commands)** — instance bootstrap, diagnostics, configuration
2. **[Control-plane commands](/cli/control-plane-commands)** — issues, agents, approvals, activity
