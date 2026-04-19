import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "@softclipai/db";
import {
  issueAcceptanceCriteria,
  issues,
  type AcceptanceCriterionStatus,
} from "@softclipai/db";
import { badRequest, notFound, unprocessable } from "../errors.js";

/**
 * Acceptance criteria service — CRUD plus a close-guard that blocks
 * `status = done` transitions on issues with any `pending` criteria.
 *
 * Criterion statuses: `pending` | `met` | `waived`. `waived` is for the
 * "we acknowledge this won't ship and we're closing anyway" case — it
 * requires a reason string.
 */

const VALID_STATUSES: AcceptanceCriterionStatus[] = ["pending", "met", "waived"];

interface ActorRef {
  agentId?: string | null;
  userId?: string | null;
}

type CriterionRow = typeof issueAcceptanceCriteria.$inferSelect;

type Dbish = Db | any;

function isValidStatus(value: unknown): value is AcceptanceCriterionStatus {
  return typeof value === "string" && (VALID_STATUSES as string[]).includes(value);
}

async function loadIssue(db: Dbish, issueId: string) {
  const rows = await db
    .select({ id: issues.id, productId: issues.productId, status: issues.status })
    .from(issues)
    .where(eq(issues.id, issueId));
  return rows[0] ?? null;
}

export function issueAcceptanceCriteriaService(db: Db) {
  async function assertIssueExists(issueId: string) {
    const issue = await loadIssue(db, issueId);
    if (!issue) throw notFound("Issue not found");
    return issue;
  }

  async function loadCriterionOrNull(id: string) {
    const rows = await db
      .select()
      .from(issueAcceptanceCriteria)
      .where(eq(issueAcceptanceCriteria.id, id));
    return rows[0] ?? null;
  }

  return {
    getById: async (id: string): Promise<CriterionRow | null> => {
      return loadCriterionOrNull(id);
    },

    list: async (issueId: string): Promise<CriterionRow[]> => {
      await assertIssueExists(issueId);
      return db
        .select()
        .from(issueAcceptanceCriteria)
        .where(eq(issueAcceptanceCriteria.issueId, issueId))
        .orderBy(
          asc(issueAcceptanceCriteria.orderIndex),
          asc(issueAcceptanceCriteria.createdAt),
        );
    },

    create: async (
      issueId: string,
      input: {
        text: string;
        orderIndex?: number;
        status?: AcceptanceCriterionStatus;
      },
      actor: ActorRef,
    ): Promise<CriterionRow> => {
      await assertIssueExists(issueId);

      const text = input.text.trim();
      if (text.length === 0) throw badRequest("Acceptance criterion text is required");
      if (text.length > 2000) {
        throw badRequest("Acceptance criterion text must be at most 2000 characters");
      }
      if (input.status !== undefined && !isValidStatus(input.status)) {
        throw badRequest(`Invalid status: ${String(input.status)}`);
      }

      const [row] = await db
        .insert(issueAcceptanceCriteria)
        .values({
          issueId,
          text,
          status: input.status ?? "pending",
          orderIndex: input.orderIndex ?? 0,
          createdByAgentId: actor.agentId ?? null,
          createdByUserId: actor.userId ?? null,
          updatedByAgentId: actor.agentId ?? null,
          updatedByUserId: actor.userId ?? null,
        })
        .returning();
      return row;
    },

    update: async (
      id: string,
      input: {
        text?: string;
        status?: AcceptanceCriterionStatus;
        orderIndex?: number;
        waivedReason?: string | null;
      },
      actor: ActorRef,
    ): Promise<CriterionRow> => {
      const existing = await loadCriterionOrNull(id);
      if (!existing) throw notFound("Acceptance criterion not found");

      const patch: Partial<typeof issueAcceptanceCriteria.$inferInsert> = {
        updatedAt: new Date(),
        updatedByAgentId: actor.agentId ?? null,
        updatedByUserId: actor.userId ?? null,
      };

      if (input.text !== undefined) {
        const text = input.text.trim();
        if (text.length === 0) throw badRequest("Acceptance criterion text is required");
        if (text.length > 2000) {
          throw badRequest("Acceptance criterion text must be at most 2000 characters");
        }
        patch.text = text;
      }

      if (input.status !== undefined) {
        if (!isValidStatus(input.status)) {
          throw badRequest(`Invalid status: ${String(input.status)}`);
        }
        patch.status = input.status;
        if (input.status === "waived") {
          const reason = (input.waivedReason ?? existing.waivedReason ?? "").trim();
          if (reason.length === 0) {
            throw unprocessable(
              "Waiving an acceptance criterion requires a waivedReason explaining the decision",
            );
          }
          patch.waivedReason = reason;
        } else {
          // Leaving waived state clears the stored reason.
          patch.waivedReason = null;
        }
      } else if (input.waivedReason !== undefined) {
        // Allow editing the reason while staying waived.
        if (existing.status !== "waived") {
          throw unprocessable(
            "waivedReason can only be set on a criterion with status=waived",
          );
        }
        const reason = (input.waivedReason ?? "").trim();
        if (reason.length === 0) {
          throw unprocessable(
            "waivedReason must be non-empty while status=waived",
          );
        }
        patch.waivedReason = reason;
      }

      if (input.orderIndex !== undefined) {
        if (!Number.isInteger(input.orderIndex)) {
          throw badRequest("orderIndex must be an integer");
        }
        patch.orderIndex = input.orderIndex;
      }

      const [row] = await db
        .update(issueAcceptanceCriteria)
        .set(patch)
        .where(eq(issueAcceptanceCriteria.id, id))
        .returning();
      return row;
    },

    delete: async (id: string): Promise<void> => {
      const existing = await loadCriterionOrNull(id);
      if (!existing) throw notFound("Acceptance criterion not found");
      await db
        .delete(issueAcceptanceCriteria)
        .where(eq(issueAcceptanceCriteria.id, id));
    },

    /**
     * Count of criteria in each status bucket for an issue. Used by both
     * the UI (progress indicator) and the close-guard.
     */
    summarize: async (
      issueId: string,
    ): Promise<{ total: number; met: number; waived: number; pending: number }> => {
      const rows = await db
        .select({ status: issueAcceptanceCriteria.status })
        .from(issueAcceptanceCriteria)
        .where(eq(issueAcceptanceCriteria.issueId, issueId));
      let met = 0;
      let waived = 0;
      let pending = 0;
      for (const row of rows) {
        if (row.status === "met") met += 1;
        else if (row.status === "waived") waived += 1;
        else pending += 1;
      }
      return { total: rows.length, met, waived, pending };
    },

    /**
     * Close-guard called from the issues service when an issue transitions
     * to `status = done`. Throws 422 if any criteria remain `pending`.
     *
     * Can be called with a transaction-scoped db handle so the guard runs
     * inside the close transaction (prevents TOCTOU with concurrent
     * criterion edits).
     */
    assertReadyToClose: async (
      issueId: string,
      opts: { dbOrTx?: Dbish } = {},
    ): Promise<void> => {
      const handle = opts.dbOrTx ?? db;
      const pendingRows = await handle
        .select({ id: issueAcceptanceCriteria.id })
        .from(issueAcceptanceCriteria)
        .where(
          and(
            eq(issueAcceptanceCriteria.issueId, issueId),
            eq(issueAcceptanceCriteria.status, "pending"),
          ),
        );
      if (pendingRows.length > 0) {
        throw unprocessable(
          `Issue has ${pendingRows.length} pending acceptance ${
            pendingRows.length === 1 ? "criterion" : "criteria"
          }. Mark them met or waived before closing.`,
          { pendingCriterionIds: pendingRows.map((r: { id: string }) => r.id) },
        );
      }
    },

    /**
     * Mark every pending criterion on an issue as `waived`, with a single
     * shared reason. For cases where the caller wants to bulk-waive at
     * close-time; still requires an explicit reason.
     */
    waiveAllPending: async (
      issueId: string,
      reason: string,
      actor: ActorRef,
    ): Promise<number> => {
      const trimmed = reason.trim();
      if (trimmed.length === 0) {
        throw unprocessable("waiveAllPending requires a non-empty reason");
      }
      const pending = await db
        .select({ id: issueAcceptanceCriteria.id })
        .from(issueAcceptanceCriteria)
        .where(
          and(
            eq(issueAcceptanceCriteria.issueId, issueId),
            eq(issueAcceptanceCriteria.status, "pending"),
          ),
        );
      if (pending.length === 0) return 0;
      const ids = pending.map((row: { id: string }) => row.id);
      await db
        .update(issueAcceptanceCriteria)
        .set({
          status: "waived",
          waivedReason: trimmed,
          updatedAt: new Date(),
          updatedByAgentId: actor.agentId ?? null,
          updatedByUserId: actor.userId ?? null,
        })
        .where(inArray(issueAcceptanceCriteria.id, ids));
      return ids.length;
    },
  };
}

export type IssueAcceptanceCriteriaService = ReturnType<
  typeof issueAcceptanceCriteriaService
>;
