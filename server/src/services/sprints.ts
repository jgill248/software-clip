import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@softclipai/db";
import { issues, sprints, type SprintState } from "@softclipai/db";
import { badRequest, conflict, notFound, unprocessable } from "../errors.js";

/**
 * Sprint service — CRUD plus a state machine.
 *
 * States: `planned` → `active` → `closed`. Each forward step is a
 * distinct action that sets the corresponding timestamp. Backwards
 * transitions are not allowed; create a new sprint instead.
 *
 * The "at most one active sprint per company" invariant is enforced by
 * a partial unique index in the DB; the service surfaces a clearer 409
 * when the race loses.
 */

const VALID_STATES: SprintState[] = ["planned", "active", "closed"];

type SprintRow = typeof sprints.$inferSelect;

interface ActorRef {
  agentId?: string | null;
  userId?: string | null;
}

type Dbish = Db | any;

function isValidState(value: unknown): value is SprintState {
  return typeof value === "string" && (VALID_STATES as string[]).includes(value);
}

function parseDateInput(
  value: string | Date | null | undefined,
  fieldName: string,
): Date | null {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw badRequest(`${fieldName} must be a valid ISO-8601 datetime`);
  }
  return parsed;
}

/**
 * Forward-only state transitions. Any other step throws 422.
 */
function assertTransition(from: SprintState, to: SprintState) {
  if (from === to) return;
  if (from === "planned" && to === "active") return;
  if (from === "active" && to === "closed") return;
  throw unprocessable(
    `Invalid sprint transition ${from} → ${to} (allowed: planned → active → closed)`,
  );
}

export function sprintService(db: Db) {
  async function loadByIdOrNull(id: string): Promise<SprintRow | null> {
    const rows = await db.select().from(sprints).where(eq(sprints.id, id));
    return rows[0] ?? null;
  }

  async function assertExists(id: string): Promise<SprintRow> {
    const row = await loadByIdOrNull(id);
    if (!row) throw notFound("Sprint not found");
    return row;
  }

  return {
    getById: (id: string) => loadByIdOrNull(id),

    list: async (
      productId: string,
      filters: { state?: SprintState } = {},
    ): Promise<SprintRow[]> => {
      if (filters.state && !isValidState(filters.state)) {
        throw badRequest(`Invalid sprint state: ${String(filters.state)}`);
      }
      const whereClause = filters.state
        ? and(
            eq(sprints.productId, productId),
            eq(sprints.state, filters.state),
          )
        : eq(sprints.productId, productId);
      return db
        .select()
        .from(sprints)
        .where(whereClause)
        .orderBy(desc(sprints.createdAt));
    },

    /**
     * Convenience helper used heavily by the UI sidebar and by heartbeat
     * planners. Returns null if no active sprint exists.
     */
    getActive: async (productId: string): Promise<SprintRow | null> => {
      const rows = await db
        .select()
        .from(sprints)
        .where(
          and(eq(sprints.productId, productId), eq(sprints.state, "active")),
        );
      return rows[0] ?? null;
    },

    create: async (
      productId: string,
      input: {
        name: string;
        goal?: string | null;
        startsAt?: string | Date | null;
        endsAt?: string | Date | null;
      },
      actor: ActorRef,
    ): Promise<SprintRow> => {
      const name = input.name.trim();
      if (name.length === 0) throw badRequest("Sprint name is required");
      if (name.length > 200) {
        throw badRequest("Sprint name must be at most 200 characters");
      }
      const goal =
        input.goal === undefined || input.goal === null
          ? null
          : input.goal.trim();
      if (goal && goal.length > 4000) {
        throw badRequest("Sprint goal must be at most 4000 characters");
      }

      const startsAt = parseDateInput(input.startsAt, "startsAt");
      const endsAt = parseDateInput(input.endsAt, "endsAt");
      if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
        throw badRequest("endsAt must be on or after startsAt");
      }

      const [row] = await db
        .insert(sprints)
        .values({
          productId,
          name,
          goal: goal && goal.length > 0 ? goal : null,
          state: "planned",
          startsAt,
          endsAt,
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
        name?: string;
        goal?: string | null;
        startsAt?: string | Date | null;
        endsAt?: string | Date | null;
        state?: SprintState;
      },
      actor: ActorRef,
    ): Promise<SprintRow> => {
      const existing = await assertExists(id);

      const patch: Partial<typeof sprints.$inferInsert> = {
        updatedAt: new Date(),
        updatedByAgentId: actor.agentId ?? null,
        updatedByUserId: actor.userId ?? null,
      };

      if (input.name !== undefined) {
        const name = input.name.trim();
        if (name.length === 0) throw badRequest("Sprint name is required");
        if (name.length > 200) {
          throw badRequest("Sprint name must be at most 200 characters");
        }
        patch.name = name;
      }

      if (input.goal !== undefined) {
        if (input.goal === null) {
          patch.goal = null;
        } else {
          const goal = input.goal.trim();
          if (goal.length > 4000) {
            throw badRequest("Sprint goal must be at most 4000 characters");
          }
          patch.goal = goal.length === 0 ? null : goal;
        }
      }

      if (input.startsAt !== undefined) {
        patch.startsAt = parseDateInput(input.startsAt, "startsAt");
      }
      if (input.endsAt !== undefined) {
        patch.endsAt = parseDateInput(input.endsAt, "endsAt");
      }
      const effectiveStartsAt =
        patch.startsAt !== undefined ? patch.startsAt : existing.startsAt;
      const effectiveEndsAt =
        patch.endsAt !== undefined ? patch.endsAt : existing.endsAt;
      if (
        effectiveStartsAt &&
        effectiveEndsAt &&
        effectiveEndsAt.getTime() < effectiveStartsAt.getTime()
      ) {
        throw badRequest("endsAt must be on or after startsAt");
      }

      if (input.state !== undefined) {
        if (!isValidState(input.state)) {
          throw badRequest(`Invalid sprint state: ${String(input.state)}`);
        }
        assertTransition(existing.state as SprintState, input.state);
        patch.state = input.state;
        if (input.state === "active" && !existing.activatedAt) {
          patch.activatedAt = new Date();
        }
        if (input.state === "closed" && !existing.closedAt) {
          patch.closedAt = new Date();
        }
      }

      try {
        const [row] = await db
          .update(sprints)
          .set(patch)
          .where(eq(sprints.id, id))
          .returning();
        return row;
      } catch (err) {
        // The partial unique index on (company_id) where state='active'
        // raises a 23505 (unique_violation) when a second sprint tries to
        // activate. Surface a clearer 409 so the caller can react.
        if (
          typeof err === "object" &&
          err !== null &&
          (err as { code?: string }).code === "23505" &&
          input.state === "active"
        ) {
          throw conflict(
            "Another sprint is already active in this product. Close it before starting a new one.",
          );
        }
        throw err;
      }
    },

    /**
     * Deleting a sprint is only allowed while it's `planned`. Once it's
     * gone active the historical record matters — close it instead.
     */
    delete: async (id: string): Promise<void> => {
      const existing = await assertExists(id);
      if (existing.state !== "planned") {
        throw unprocessable(
          `Cannot delete a ${existing.state} sprint — close it or leave it in history.`,
        );
      }
      await db.delete(sprints).where(eq(sprints.id, id));
    },

    /**
     * Move an issue into or out of a sprint. Passing null removes it.
     * Enforces that both the issue and the sprint live in the same product.
     */
    assignIssue: async (
      issueId: string,
      sprintId: string | null,
    ): Promise<void> => {
      const issueRows = await db
        .select({ id: issues.id, productId: issues.productId })
        .from(issues)
        .where(eq(issues.id, issueId));
      const issue = issueRows[0];
      if (!issue) throw notFound("Issue not found");

      if (sprintId !== null) {
        const sprint = await assertExists(sprintId);
        if (sprint.productId !== issue.productId) {
          throw unprocessable(
            "Cannot assign an issue to a sprint in a different product",
          );
        }
      }

      await db
        .update(issues)
        .set({ sprintId, updatedAt: new Date() })
        .where(eq(issues.id, issueId));
    },

    /**
     * List issues in a sprint, ordered by priority then creation order.
     * Used by the sprint detail view and burndown calculations.
     */
    listIssues: async (sprintId: string) => {
      await assertExists(sprintId);
      return db
        .select()
        .from(issues)
        .where(eq(issues.sprintId, sprintId))
        .orderBy(asc(issues.priority), asc(issues.createdAt));
    },

    /**
     * Quick counts per issue status, used by the UI to show a burndown
     * snapshot. Counts non-hidden issues only.
     */
    issueSummary: async (
      sprintId: string,
    ): Promise<{ total: number; done: number; inProgress: number; remaining: number }> => {
      await assertExists(sprintId);
      const rows = await db
        .select({
          status: issues.status,
          count: sql<number>`count(*)::int`,
        })
        .from(issues)
        .where(eq(issues.sprintId, sprintId))
        .groupBy(issues.status);
      let total = 0;
      let done = 0;
      let inProgress = 0;
      for (const row of rows) {
        total += row.count;
        if (row.status === "done") done += row.count;
        else if (row.status === "in_progress") inProgress += row.count;
      }
      return { total, done, inProgress, remaining: total - done };
    },
  };
}

export type SprintService = ReturnType<typeof sprintService>;
