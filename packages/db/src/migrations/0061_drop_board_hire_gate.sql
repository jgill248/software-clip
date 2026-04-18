-- Softclip pivot §6: drop board-governance hire gate.
--
-- The `require_board_approval_for_new_agents` flag made new agent
-- hires land in `pending_approval` status and spawn a `hire_agent`
-- approval that a human had to resolve before the agent could run.
-- Dev teams don't govern hiring that way — a PO adds team members
-- like any engineering org would. The column is removed along with
-- its enforcement gate in routes/agents.ts.
--
-- Anyone who relied on the gate can re-create the workflow via the
-- generic approvals primitive.

ALTER TABLE "companies" DROP COLUMN IF EXISTS "require_board_approval_for_new_agents";
