import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueAcceptanceCriteriaService } from "../services/issue-acceptance-criteria.js";

/**
 * These tests drive issueAcceptanceCriteriaService through a hand-rolled
 * drizzle stub. The stub captures which table was queried and what
 * `where` predicates were built so we can match the service's intent
 * without needing a real Postgres handy.
 *
 * We test the behavioural contract: empty text rejected, waived status
 * requires a reason, close-guard throws iff any pending criteria exist.
 */

type CriterionRow = {
  id: string;
  issueId: string;
  text: string;
  status: "pending" | "met" | "waived";
  orderIndex: number;
  waivedReason: string | null;
  createdByAgentId: string | null;
  createdByUserId: string | null;
  updatedByAgentId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface StubState {
  issue: { id: string; productId: string; status: string } | null;
  criteria: CriterionRow[];
}

function makeCriterion(
  overrides: Partial<CriterionRow> = {},
): CriterionRow {
  const now = new Date("2026-04-18T00:00:00.000Z");
  return {
    id: overrides.id ?? `crit-${Math.random().toString(36).slice(2, 8)}`,
    issueId: overrides.issueId ?? "issue-1",
    text: overrides.text ?? "User can export their notes as CSV",
    status: overrides.status ?? "pending",
    orderIndex: overrides.orderIndex ?? 0,
    waivedReason: overrides.waivedReason ?? null,
    createdByAgentId: overrides.createdByAgentId ?? null,
    createdByUserId: overrides.createdByUserId ?? null,
    updatedByAgentId: overrides.updatedByAgentId ?? null,
    updatedByUserId: overrides.updatedByUserId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

/**
 * Minimal drizzle-shaped stub. We discriminate "is this an issues
 * query?" by inspecting the fields passed to `select()` — the issues
 * query explicitly selects productId, while every criteria query
 * either passes no fields (full row) or selects id/status.
 */
function makeDbStub(state: StubState, pendingFilter: "all" | "pending-only" = "all") {
  function isIssuesQuery(fields: unknown): boolean {
    if (!fields || typeof fields !== "object") return false;
    return "productId" in fields;
  }

  const selectBuilder = (fields?: unknown) => {
    const queryingIssues = isIssuesQuery(fields);
    return {
      from: (_table: unknown) => {
        const runWhere = (): unknown[] => {
          if (queryingIssues) {
            return state.issue ? [state.issue] : [];
          }
          const criteria =
            pendingFilter === "pending-only"
              ? state.criteria.filter((row) => row.status === "pending")
              : state.criteria;
          return criteria;
        };
        return {
          where: (_predicate: unknown) => {
            const result = runWhere();
            return Object.assign(Promise.resolve(result), {
              orderBy: (..._a: unknown[]) => Promise.resolve(result),
            });
          },
        };
      },
    };
  };

  const insertBuilder = () => ({
    values: (row: Partial<CriterionRow>) => ({
      returning: async () => {
        const full = makeCriterion({ ...row, id: row.id ?? "crit-new" });
        state.criteria.push(full);
        return [full];
      },
    }),
  });

  const updateBuilder = () => ({
    set: (patch: Partial<CriterionRow>) => ({
      where: (_predicate: unknown) => ({
        returning: async () => {
          // Apply patch to every row for simplicity; most tests update
          // one row or expect a specific row to be patched.
          state.criteria = state.criteria.map((row) => ({
            ...row,
            ...patch,
            updatedAt: patch.updatedAt ?? row.updatedAt,
          }));
          return state.criteria;
        },
      }),
    }),
  });

  const deleteBuilder = () => ({
    where: (_predicate: unknown) => {
      state.criteria = [];
      return Promise.resolve();
    },
  });

  return {
    select: selectBuilder,
    insert: insertBuilder,
    update: updateBuilder,
    delete: deleteBuilder,
  } as any;
}

describe("issueAcceptanceCriteriaService", () => {
  let state: StubState;

  beforeEach(() => {
    state = {
      issue: { id: "issue-1", productId: "co-1", status: "in_progress" },
      criteria: [],
    };
  });

  describe("create", () => {
    it("inserts a criterion with trimmed text and pending default status", async () => {
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      const row = await svc.create(
        "issue-1",
        { text: "  User can undo  " },
        { agentId: "a-1", userId: null },
      );
      expect(row.text).toBe("User can undo");
      expect(row.status).toBe("pending");
    });

    it("rejects empty text", async () => {
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(
        svc.create("issue-1", { text: "   " }, { agentId: null, userId: null }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects text longer than 2000 chars", async () => {
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(
        svc.create(
          "issue-1",
          { text: "x".repeat(2001) },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 404 when the issue doesn't exist", async () => {
      state.issue = null;
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(
        svc.create("missing", { text: "hi" }, { agentId: null, userId: null }),
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("update", () => {
    it("requires a waivedReason when transitioning to waived", async () => {
      state.criteria = [makeCriterion({ status: "pending" })];
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(
        svc.update(
          state.criteria[0].id,
          { status: "waived" },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 422 });
    });

    it("accepts status=waived with a waivedReason", async () => {
      state.criteria = [makeCriterion({ status: "pending" })];
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      const row = await svc.update(
        state.criteria[0].id,
        { status: "waived", waivedReason: "Covered by future ticket ABC-42" },
        { agentId: null, userId: null },
      );
      expect(row.status).toBe("waived");
      expect(row.waivedReason).toBe("Covered by future ticket ABC-42");
    });

    it("clears waivedReason when leaving waived state", async () => {
      state.criteria = [
        makeCriterion({ status: "waived", waivedReason: "was-waived" }),
      ];
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      const row = await svc.update(
        state.criteria[0].id,
        { status: "met" },
        { agentId: null, userId: null },
      );
      expect(row.status).toBe("met");
      expect(row.waivedReason).toBeNull();
    });

    it("refuses to set waivedReason on a non-waived criterion", async () => {
      state.criteria = [makeCriterion({ status: "pending" })];
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(
        svc.update(
          state.criteria[0].id,
          { waivedReason: "stray reason" },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 422 });
    });
  });

  describe("summarize", () => {
    it("buckets criteria by status", async () => {
      state.criteria = [
        makeCriterion({ id: "a", status: "pending" }),
        makeCriterion({ id: "b", status: "met" }),
        makeCriterion({ id: "c", status: "met" }),
        makeCriterion({ id: "d", status: "waived", waivedReason: "x" }),
      ];
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      const summary = await svc.summarize("issue-1");
      expect(summary).toEqual({ total: 4, met: 2, waived: 1, pending: 1 });
    });
  });

  describe("assertReadyToClose", () => {
    it("passes when there are no criteria", async () => {
      state.criteria = [];
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(svc.assertReadyToClose("issue-1")).resolves.toBeUndefined();
    });

    it("passes when every criterion is met or waived", async () => {
      state.criteria = [
        makeCriterion({ status: "met" }),
        makeCriterion({ status: "waived", waivedReason: "won't ship" }),
      ];
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(svc.assertReadyToClose("issue-1")).resolves.toBeUndefined();
    });

    it("throws 422 when any criterion is pending", async () => {
      state.criteria = [
        makeCriterion({ status: "met" }),
        makeCriterion({ status: "pending", id: "crit-pending" }),
      ];
      // assertReadyToClose selects with `where status = 'pending'`; the
      // stub returns the filtered set when `pending-only` mode is set.
      const svc = issueAcceptanceCriteriaService(
        makeDbStub(state, "pending-only"),
      );
      await expect(svc.assertReadyToClose("issue-1")).rejects.toMatchObject({
        status: 422,
      });
    });
  });

  describe("waiveAllPending", () => {
    it("returns 0 when nothing is pending", async () => {
      state.criteria = [makeCriterion({ status: "met" })];
      const svc = issueAcceptanceCriteriaService(
        makeDbStub(state, "pending-only"),
      );
      const count = await svc.waiveAllPending(
        "issue-1",
        "accepted debt",
        { agentId: null, userId: null },
      );
      expect(count).toBe(0);
    });

    it("requires a non-empty reason", async () => {
      const svc = issueAcceptanceCriteriaService(makeDbStub(state));
      await expect(
        svc.waiveAllPending("issue-1", "   ", { agentId: null, userId: null }),
      ).rejects.toMatchObject({ status: 422 });
    });
  });
});
