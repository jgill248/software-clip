# TOOLS.md — Security tool & skill guide

## Skills

- **`softclip`** — control-plane coordination (issues, approvals,
  comments).
- **`para-memory-files`** — durable memory. Use for threat
  intel, incident timelines, and risk-accepted records.
- **`security-review`** — review the pending changes on the
  current branch for vulnerabilities. Run this when you pick up a
  security PR review task.

## Scanners

Pick one tool per scan type; don't wire two scanners for the same
job (they'll fight and the team will ignore both).

- **SCA / dependency CVEs** — `pnpm audit`, `osv-scanner`, or the
  GitHub MCP secret scanning API. Configure to block on HIGH or
  higher.
- **SAST** — the security-review skill above; or a language-native
  linter rule set (ESLint security plugin, Semgrep rules).
  Prioritise rules that catch the review-checklist classes in
  `AGENTS.md`.
- **Secret scan** — pre-commit + PR hook. Your job is to tune the
  ignore list, not run it manually every heartbeat.
- **Container scan** — Trivy or equivalent on any Dockerfile /
  image we publish. DevOps wires it; you set policy.

## API surfaces you'll hit most

- `GET /api/products/{companyId}/approvals?type=approve_plan&status=pending,revision_requested`
  — in-flight plans you need to annotate.
- `POST /api/approvals/{id}/resubmit` — add/update the `security`
  section on a plan payload.
- `POST /api/issues/{id}/reviews` with `reviewType=approve_pr` —
  sign off (or request changes on) a security-sensitive PR.
- `GET /api/products/{companyId}/issues?label=security` — the
  findings backlog.
- `GET /api/products/{companyId}/secrets` — check what's already
  in the secrets service.

## External tools

- **`mcp__github__run_secret_scanning`** — kick off a secret scan
  against the repo.
- **`mcp__github__search_code`** — hunt for patterns the scanners
  don't catch (e.g. stray `console.log(req.headers.authorization)`).
- **Grep / Glob** — quick surveys of new routes, new outbound
  calls, new deserialisation paths.
- **Read** — threat-model authoring needs you to actually read
  the handler end-to-end.
- **Bash** — running scanners locally, generating proof-of-concept
  repros.

## Local commands you'll run a lot

- `pnpm audit --prod` — production dependency CVEs.
- `pnpm exec tsc -b` — surface type holes on trust boundaries.
- Whatever scanners you've adopted, with flags captured in
  `docs/security/scanner-config.md`.

## Anti-patterns

- **Severity inflation.** Calling everything Critical trains the
  team to ignore the label. Use the SLA table honestly.
- **Scanner noise.** Unfiltered scanner output buries real
  findings. Tune the ignore list; suppress with justification.
- **Finding without repro.** A hypothesis is not a vulnerability.
  Repro or downgrade.
- **Silent accepted risk.** A finding that "seems fine" gets
  recorded in `docs/security/accepted-risks.md` or gets a fix
  issue. Never just closed.
- **Reviewing in isolation.** Read the threat model before
  reviewing a PR. Context-free reviews miss the real issues.
- **Lecturing in reviews.** Leave the fix and the reason; leave
  the history-of-web-security essay for a threat-model update.
