# TOOLS.md — DevOps tool & skill guide

## Skills

- **`softclip`** — control-plane coordination (issues, approvals,
  comments, release-issue management).
- **`para-memory-files`** — durable memory. Use for runbook
  history, incident timelines, and "we tried X and it didn't
  work" notes.

## CI / pipeline tools

- **`mcp__github__list_commits`** — check whether main is green.
- **`mcp__github__get_commit`** — pull a commit's CI status when
  investigating a red main.
- **GitHub workflow files** — edit `.github/workflows/*.yml`
  through the normal PR flow; never commit directly to main.
- **Workflow linter** — run the workflow schema check locally
  before pushing pipeline changes (your editor may do this;
  otherwise `act` or GitHub's `--validate-only` on the CLI).

## Infrastructure tools

- **IaC** — Terraform / Helm / Kustomize / Pulumi (whichever the
  repo has). Always run `plan` / `diff` locally, paste output
  into the PR description.
- **Secrets** — `/api/companies/:id/secrets` for app secrets,
  the cloud provider's secret manager for infra secrets. Never
  bake secrets into IaC files.
- **Container images** — Docker / Buildx. Tag with semver +
  commit SHA. Never push `:latest` for anything production.

## Observability

- **Metrics** — Prometheus / the platform's native metrics. Name
  metrics `<service>_<unit>_<dimension>`; label consistently.
- **Logs** — structured JSON. Never log secrets or tokens. Log
  IDs you can correlate, not values you can't.
- **Traces** — OpenTelemetry where available. Prefer traces over
  custom metrics for request-path work.
- **Dashboards** — one dashboard per service, one row per SLO.
  Home dashboard links to each service.

## API surfaces you'll hit most

- `GET /api/companies/{companyId}/approvals?type=approve_plan&status=pending,revision_requested`
  — in-flight plans needing a devops section.
- `POST /api/approvals/{id}/resubmit` — add/update the `devops`
  section on a plan payload.
- `POST /api/issues/{id}/reviews` with `reviewType=approve_architecture`
  — your sign-off when deploy topology changes.
- `GET /api/companies/{companyId}/issues?label=release` — the
  release queue.
- `GET /api/companies/{companyId}/issues?label=incident` — the
  active-incident queue.
- `GET /api/companies/{companyId}/issues?label=flake` — the
  flake backlog.

## External tools

- **Bash** — most CI/infra work is command-line. Favourite flags
  pinned in `docs/ops/cheatsheet.md` so successors find them.
- **Grep / Glob** — hunting through workflow files and IaC when
  you're not sure where a setting lives.
- **Read** — runbook drafting needs you to read the alerting code
  end-to-end so the runbook matches reality.

## Local commands you'll run a lot

- `pnpm test:release-smoke` — release-candidate smoke suite.
- `pnpm build` — pre-push sanity to confirm the build still
  compiles.
- `docker compose up` / `docker compose down` — local stack
  rehearsal before shipping infra changes.
- Whatever IaC `plan` / `diff` command your platform uses — run
  locally, paste the output into the PR.

## Anti-patterns

- **Manual deploy on a Friday.** If the pipeline can't deploy
  safely, the pipeline is the work item, not the manual deploy.
- **Alerts without runbooks.** Pager noise trains the team to
  ignore real incidents. Either runbook it or delete it.
- **"Just this once" cowboy commits to main.** Hotfixes go
  through the same PR flow as anything else; the pipeline is
  what makes them safe.
- **Silent retries.** A retry without a log line is a bug
  hiding. Log the retry; count the retries; alert on spikes.
- **Long-lived feature branches.** Branches drift; merges get
  painful. Keep infra branches short-lived or split the work.
- **Runbooks written in the calm.** A runbook that's never been
  rehearsed is a creative writing exercise. Walk every runbook
  against a real alert firing at least once a quarter.
