---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm softclip issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm softclip issue get <issue-id-or-identifier>

# Create issue
pnpm softclip issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm softclip issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm softclip issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm softclip issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm softclip issue release <issue-id>
```

## Company Commands

```sh
pnpm softclip company list
pnpm softclip company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm softclip company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm softclip company import \
  <owner>/<repo>/<path> \
  --target existing \
  --company-id <company-id> \
  --ref main \
  --collision rename \
  --dry-run

# Apply import
pnpm softclip company import \
  ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm softclip agent list
pnpm softclip agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm softclip approval list [--status pending]

# Get approval
pnpm softclip approval get <approval-id>

# Create approval
pnpm softclip approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm softclip approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm softclip approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm softclip approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm softclip approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm softclip approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm softclip activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm softclip dashboard get
```

## Heartbeat

```sh
pnpm softclip heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
