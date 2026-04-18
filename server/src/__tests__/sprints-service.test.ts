import { beforeEach, describe, expect, it } from "vitest";
import { sprintService } from "../services/sprints.js";

/**
 * Sprint service tests driven by a hand-rolled drizzle stub. We lean on
 * the service's public contract: transitions, name/goal bounds, date
 * validation, and the "no active twin" conflict mapping.
 */

type SprintState = "planned" | "active" | "closed";

type SprintRow = {
  id: string;
  companyId: string;
  name: string;
  goal: string | null;
  state: SprintState;
  startsAt: Date | null;
  endsAt: Date | null;
  activatedAt: Date | null;
  closedAt: Date | null;
  createdByAgentId: string | null;
  createdByUserId: string | null;
  updatedByAgentId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type IssueRow = {
  id: string;
  companyId: string;
  sprintId: string | null;
  status: string;
  priority: string;
  createdAt: Date;
};

interface StubState {
  sprints: SprintRow[];
  issues: IssueRow[];
  nextUpdateError?: { code?: string } | null;
}

function makeSprint(overrides: Partial<SprintRow> = {}): SprintRow {
  const now = new Date("2026-04-18T00:00:00.000Z");
  return {
    id: overrides.id ?? `sprint-${Math.random().toString(36).slice(2, 8)}`,
    companyId: overrides.companyId ?? "co-1",
    name: overrides.name ?? "Sprint 1",
    goal: overrides.goal ?? null,
    state: overrides.state ?? "planned",
    startsAt: overrides.startsAt ?? null,
    endsAt: overrides.endsAt ?? null,
    activatedAt: overrides.activatedAt ?? null,
    closedAt: overrides.closedAt ?? null,
    createdByAgentId: overrides.createdByAgentId ?? null,
    createdByUserId: overrides.createdByUserId ?? null,
    updatedByAgentId: overrides.updatedByAgentId ?? null,
    updatedByUserId: overrides.updatedByUserId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

/**
 * Stub. We discriminate sprints vs issues queries by whether `select()`
 * was called with issue-shaped fields (has `priority`) or unspecified
 * (full row). For selects-with-no-fields we use an explicit "target"
 * argument on each call site instead of guessing — but since the
 * service happens to do `select()` with no args on both, we instead
 * look at the first column passed to `.from()` by casting to any and
 * reading a `.name` if present. Simpler: track which was last selected
 * by setting `state.mode` before each call.
 *
 * Pragmatic approach: expose two distinct stubs, one that answers
 * sprint queries and one that answers issue queries, and have tests
 * use whichever they need. When a test exercises both (assignIssue),
 * we compose.
 */
function makeDbStub(state: StubState) {
  function fromTargetFromFirstArg(table: unknown): "sprints" | "issues" {
    // Drizzle tables expose `Symbol.toStringTag` but not reliably a name.
    // Our service imports them as named objects — we tag them via a weak
    // marker below when a test calls `.from(sprintsToken)` or
    // `.from(issuesToken)`. To avoid needing real drizzle tables, we
    // simply look at the object identity through `_stubTable`.
    if (typeof table === "object" && table !== null) {
      const tag = (table as { _stubTable?: string })._stubTable;
      if (tag === "sprints" || tag === "issues") return tag;
    }
    // Fallback: most queries target sprints; the assignIssue + listIssues
    // paths explicitly pass the issues-tagged object.
    return "sprints";
  }

  const selectBuilder = (_fields?: unknown) => ({
    from: (table: unknown) => {
      const target = fromTargetFromFirstArg(table);
      const matchingRows = (): unknown[] =>
        target === "sprints" ? state.sprints : state.issues;
      return {
        where: (_predicate: unknown) => {
          const result = matchingRows();
          return Object.assign(Promise.resolve(result), {
            orderBy: (..._a: unknown[]) => Promise.resolve(result),
            groupBy: (..._a: unknown[]) => Promise.resolve(result),
          });
        },
      };
    },
  });

  const insertBuilder = (_table: unknown) => ({
    values: (row: Partial<SprintRow>) => ({
      returning: async () => {
        const full = makeSprint(row);
        state.sprints.push(full);
        return [full];
      },
    }),
  });

  const updateBuilder = (table: unknown) => ({
    set: (patch: Partial<SprintRow> | Partial<IssueRow>) => ({
      where: (_predicate: unknown) => {
        const returningFn = async () => {
          if (state.nextUpdateError) {
            const err = state.nextUpdateError;
            state.nextUpdateError = null;
            const e = new Error("stubbed db error");
            (e as any).code = err.code;
            throw e;
          }
          const tag = (table as { _stubTable?: string })?._stubTable;
          if (tag === "issues") {
            state.issues = state.issues.map((row) => ({
              ...row,
              ...(patch as Partial<IssueRow>),
            }));
            return state.issues;
          }
          state.sprints = state.sprints.map((row) => ({
            ...row,
            ...(patch as Partial<SprintRow>),
            updatedAt: (patch as Partial<SprintRow>).updatedAt ?? row.updatedAt,
          }));
          return state.sprints;
        };
        // The service uses `.where(...).returning()` on update. Our
        // stub also needs to support the issues-assign path which uses
        // `.where(...)` without returning; both work if we return an
        // object that has `.returning` AND is a thenable.
        const thenable = Promise.resolve(undefined);
        return Object.assign(thenable, { returning: returningFn });
      },
    }),
  });

  const deleteBuilder = (_table: unknown) => ({
    where: (_predicate: unknown) => {
      state.sprints = [];
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

// The service imports `sprints` and `issues` from @paperclipai/db. Tests
// don't control those imports, but the stub's fromTargetFromFirstArg()
// falls back to "sprints" for unknown tables. To make the stub route
// correctly for issue queries we inject the tag via module mock in the
// `sprint-stub.test` if needed. For the tests below, every query is
// against the sprints table except assignIssue/listIssues, which we
// sidestep by stubbing the db to return issues on any unknown table.

describe("sprintService", () => {
  let state: StubState;

  beforeEach(() => {
    state = { sprints: [], issues: [], nextUpdateError: null };
  });

  describe("create", () => {
    it("creates a planned sprint with trimmed name and null goal", async () => {
      const svc = sprintService(makeDbStub(state));
      const row = await svc.create(
        "co-1",
        { name: "  Sprint 5  " },
        { agentId: null, userId: "u-1" },
      );
      expect(row.name).toBe("Sprint 5");
      expect(row.state).toBe("planned");
      expect(row.goal).toBeNull();
    });

    it("rejects empty name", async () => {
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.create("co-1", { name: " " }, { agentId: null, userId: null }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects name over 200 chars", async () => {
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.create(
          "co-1",
          { name: "x".repeat(201) },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects endsAt before startsAt", async () => {
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.create(
          "co-1",
          {
            name: "Sprint 1",
            startsAt: "2026-05-01T00:00:00.000Z",
            endsAt: "2026-04-01T00:00:00.000Z",
          },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects malformed date strings", async () => {
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.create(
          "co-1",
          { name: "Sprint 1", startsAt: "not-a-date" as any },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe("update state transitions", () => {
    it("allows planned -> active and stamps activatedAt", async () => {
      state.sprints = [makeSprint({ id: "s-1", state: "planned" })];
      const svc = sprintService(makeDbStub(state));
      const row = await svc.update(
        "s-1",
        { state: "active" },
        { agentId: null, userId: null },
      );
      expect(row.state).toBe("active");
      expect(row.activatedAt).toBeInstanceOf(Date);
    });

    it("allows active -> closed and stamps closedAt", async () => {
      state.sprints = [
        makeSprint({
          id: "s-1",
          state: "active",
          activatedAt: new Date(),
        }),
      ];
      const svc = sprintService(makeDbStub(state));
      const row = await svc.update(
        "s-1",
        { state: "closed" },
        { agentId: null, userId: null },
      );
      expect(row.state).toBe("closed");
      expect(row.closedAt).toBeInstanceOf(Date);
    });

    it("rejects backwards transitions (active -> planned)", async () => {
      state.sprints = [makeSprint({ id: "s-1", state: "active" })];
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.update(
          "s-1",
          { state: "planned" },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 422 });
    });

    it("rejects skip transitions (planned -> closed)", async () => {
      state.sprints = [makeSprint({ id: "s-1", state: "planned" })];
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.update(
          "s-1",
          { state: "closed" },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 422 });
    });

    it("maps a 23505 unique_violation on activation to a 409 conflict", async () => {
      state.sprints = [makeSprint({ id: "s-1", state: "planned" })];
      state.nextUpdateError = { code: "23505" };
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.update(
          "s-1",
          { state: "active" },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe("delete", () => {
    it("allows deleting a planned sprint", async () => {
      state.sprints = [makeSprint({ id: "s-1", state: "planned" })];
      const svc = sprintService(makeDbStub(state));
      await expect(svc.delete("s-1")).resolves.toBeUndefined();
    });

    it("refuses to delete an active sprint", async () => {
      state.sprints = [makeSprint({ id: "s-1", state: "active" })];
      const svc = sprintService(makeDbStub(state));
      await expect(svc.delete("s-1")).rejects.toMatchObject({ status: 422 });
    });

    it("refuses to delete a closed sprint", async () => {
      state.sprints = [makeSprint({ id: "s-1", state: "closed" })];
      const svc = sprintService(makeDbStub(state));
      await expect(svc.delete("s-1")).rejects.toMatchObject({ status: 422 });
    });
  });

  describe("getActive", () => {
    it("returns null when no sprints exist", async () => {
      const svc = sprintService(makeDbStub(state));
      const active = await svc.getActive("co-1");
      expect(active).toBeNull();
    });
  });

  describe("update validation", () => {
    it("rejects endsAt earlier than existing startsAt", async () => {
      state.sprints = [
        makeSprint({
          id: "s-1",
          startsAt: new Date("2026-05-01T00:00:00.000Z"),
        }),
      ];
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.update(
          "s-1",
          { endsAt: "2026-04-01T00:00:00.000Z" },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects goal text over 4000 chars", async () => {
      state.sprints = [makeSprint({ id: "s-1" })];
      const svc = sprintService(makeDbStub(state));
      await expect(
        svc.update(
          "s-1",
          { goal: "x".repeat(4001) },
          { agentId: null, userId: null },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});
