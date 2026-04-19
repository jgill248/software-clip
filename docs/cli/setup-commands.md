---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `softclip run`

One-command bootstrap and start:

```sh
pnpm softclip run
```

Does:

1. Auto-onboards if config is missing
2. Runs `softclip doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm softclip run --instance dev
```

## `softclip onboard`

Interactive first-time setup:

```sh
pnpm softclip onboard
```

If Softclip is already configured, rerunning `onboard` keeps the existing config in place. Use `softclip configure` to change settings on an existing install.

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm softclip onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm softclip onboard --yes
```

On an existing install, `--yes` now preserves the current config and just starts Paperclip with that setup.

## `softclip doctor`

Health checks with optional auto-repair:

```sh
pnpm softclip doctor
pnpm softclip doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `softclip configure`

Update configuration sections:

```sh
pnpm softclip configure --section server
pnpm softclip configure --section secrets
pnpm softclip configure --section storage
```

## `softclip env`

Show resolved environment configuration:

```sh
pnpm softclip env
```

This now includes bind-oriented deployment settings such as `PAPERCLIP_BIND` and `PAPERCLIP_BIND_HOST` when configured.

## `softclip allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm softclip allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.paperclip/instances/default/config.json` |
| Database | `~/.paperclip/instances/default/db` |
| Logs | `~/.paperclip/instances/default/logs` |
| Storage | `~/.paperclip/instances/default/data/storage` |
| Secrets key | `~/.paperclip/instances/default/secrets/master.key` |

Override with:

```sh
PAPERCLIP_HOME=/custom/home PAPERCLIP_INSTANCE_ID=dev pnpm softclip run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm softclip run --data-dir ./tmp/paperclip-dev
pnpm softclip doctor --data-dir ./tmp/paperclip-dev
```
