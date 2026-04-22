<p align="center">
  <img src="https://raw.githubusercontent.com/jgill248/software-clip/master/doc/assets/header.png" alt="Softclip — orchestrate an AI software dev team" width="720" />
</p>

<p align="center">
  <a href="#quickstart"><strong>Quickstart</strong></a> &middot;
  <a href="https://github.com/jgill248/software-clip"><strong>GitHub</strong></a>
</p>

<p align="center">
  <a href="https://github.com/jgill248/software-clip/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://github.com/jgill248/software-clip/stargazers"><img src="https://img.shields.io/github/stars/jgill248/software-clip?style=flat" alt="Stars" /></a>
</p>

<br/>

# `softclip` — CLI for Softclip

This package is the command-line entry point for
[Softclip](https://github.com/jgill248/software-clip), an open-source
orchestrator for AI software-development teams. The CLI scaffolds a
product, bootstraps a Product Owner, and gives you shell access to the
same surface the UI uses.

If you want the product pitch, architecture, and full docs, start at the
[repo README](https://github.com/jgill248/software-clip#readme).

<br/>

## Quickstart

```bash
npx softclip onboard --yes
```

First run lands you on trusted local loopback mode with an embedded
Postgres and an invite URL for the first admin. To bind on LAN or
Tailscale instead:

```bash
npx softclip onboard --yes --bind lan
# or
npx softclip onboard --yes --bind tailnet
```

Already configured? Rerunning `onboard` leaves your config in place. Use
`softclip configure` to edit settings.

<br/>

## Common commands

| Command | What it does |
| --- | --- |
| `softclip onboard` | Interactive setup (Postgres, ports, auth mode, first admin invite) |
| `softclip run` | Start the server without re-running setup |
| `softclip auth bootstrap-product-owner` | Mint a one-time invite URL for the first admin (aliased to `bootstrap-ceo` for back-compat) |
| `softclip dashboard` | Terminal view of a product: agents, issues, ceremonies |
| `softclip issue` | CRUD over issues from the shell |
| `softclip heartbeat-run` | Manually drive an agent's heartbeat (useful for debugging) |
| `softclip agent` | Inspect or edit agents |
| `softclip routine` | Manage ceremonies / recurring work |
| `softclip worktree` | Inspect and repair per-worktree instance state |

Run `softclip --help` for the full list.

<br/>

## Requirements

- Node.js 20+
- pnpm 9.15+ (for local development)

<br/>

## License

MIT &copy; 2026 Softclip
