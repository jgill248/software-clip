# Softclip MCP Server

Model Context Protocol server for Softclip.

This package is a thin MCP wrapper over the existing Softclip REST API. It does
not talk to the database directly and it does not reimplement business logic.

## Authentication

The server reads its configuration from environment variables:

- `SOFTCLIP_API_URL` - Softclip base URL, for example `http://localhost:3100`
- `SOFTCLIP_API_KEY` - bearer token used for `/api` requests
- `SOFTCLIP_COMPANY_ID` - optional default company for company-scoped tools
- `SOFTCLIP_AGENT_ID` - optional default agent for checkout helpers
- `SOFTCLIP_RUN_ID` - optional run id forwarded on mutating requests

## Usage

```sh
npx -y @softclipai/mcp-server
```

Or locally in this repo:

```sh
pnpm --filter @softclipai/mcp-server build
node packages/mcp-server/dist/stdio.js
```

## Tool Surface

Read tools:

- `softclipMe`
- `softclipInboxLite`
- `softclipListAgents`
- `softclipGetAgent`
- `softclipListIssues`
- `softclipGetIssue`
- `softclipGetHeartbeatContext`
- `softclipListComments`
- `softclipGetComment`
- `softclipListIssueApprovals`
- `softclipListDocuments`
- `softclipGetDocument`
- `softclipListDocumentRevisions`
- `softclipListProjects`
- `softclipGetProject`
- `softclipListGoals`
- `softclipGetGoal`
- `softclipListApprovals`
- `softclipGetApproval`
- `softclipGetApprovalIssues`
- `softclipListApprovalComments`

Write tools:

- `softclipCreateIssue`
- `softclipUpdateIssue`
- `softclipCheckoutIssue`
- `softclipReleaseIssue`
- `softclipAddComment`
- `softclipUpsertIssueDocument`
- `softclipRestoreIssueDocumentRevision`
- `softclipCreateApproval`
- `softclipLinkIssueApproval`
- `softclipUnlinkIssueApproval`
- `softclipApprovalDecision`
- `softclipAddApprovalComment`

Escape hatch:

- `softclipApiRequest`

`softclipApiRequest` is limited to paths under `/api` and JSON bodies. It is
meant for endpoints that do not yet have a dedicated MCP tool.
