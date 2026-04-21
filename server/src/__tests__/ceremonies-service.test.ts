import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CEREMONY_TEMPLATES,
  ceremonyService,
  getCeremonyTemplate,
} from "../services/ceremonies.js";

/**
 * We mock the routine service module so the ceremony service's
 * `seedDefaults` call into `routineSvc.create` is captured. The db
 * passed in is used only for the findExistingByTitle query, which we
 * answer with a controllable stub.
 */

const routineCreate = vi.fn();

vi.mock("../services/routines.js", () => ({
  routineService: vi.fn(() => ({ create: routineCreate })),
}));

interface StubState {
  existingTitles: Set<string>;
}

/**
 * The stub can't introspect drizzle predicates, so it walks the template
 * titles in the same order the service iterates them. `queriedTitles`
 * defaults to every template title; tests that pass a `slugs` filter
 * must pass the matching title list so the stub lines up with the
 * queries the service actually makes.
 */
function makeDbStub(
  state: StubState,
  queriedTitles: readonly string[] = CEREMONY_TEMPLATES.map((t) => t.title),
) {
  let callIdx = 0;
  return {
    select: (_fields?: unknown) => ({
      from: (_table: unknown) => ({
        where: (_predicate: unknown) => {
          const title = queriedTitles[callIdx++];
          if (title && state.existingTitles.has(title)) {
            return Promise.resolve([{ id: `pre-${title}`, title }]);
          }
          return Promise.resolve([]);
        },
      }),
    }),
  } as any;
}

describe("ceremony templates", () => {
  it("ships five default ceremonies", () => {
    expect(CEREMONY_TEMPLATES).toHaveLength(5);
  });

  it("each template has a non-empty title and description", () => {
    for (const t of CEREMONY_TEMPLATES) {
      expect(t.slug.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.description.trim().length).toBeGreaterThan(50);
    }
  });

  it("slugs are unique and kebab-case", () => {
    const slugs = CEREMONY_TEMPLATES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("getCeremonyTemplate returns the template or null", () => {
    expect(getCeremonyTemplate("daily-standup")?.title).toBe("Daily standup");
    expect(getCeremonyTemplate("nope")).toBeNull();
  });
});

describe("ceremonyService.seedDefaults", () => {
  let state: StubState;

  beforeEach(() => {
    routineCreate.mockReset();
    routineCreate.mockImplementation(async (_companyId, input, _actor) => ({
      id: `new-${input.title}`,
      title: input.title,
    }));
    state = { existingTitles: new Set() };
  });

  it("creates all five ceremonies when none exist", async () => {
    const svc = ceremonyService(makeDbStub(state));
    const outcome = await svc.seedDefaults("co-1", {
      agentId: null,
      userId: "u-1",
    });
    expect(outcome.created).toHaveLength(5);
    expect(outcome.skipped).toHaveLength(0);
    expect(routineCreate).toHaveBeenCalledTimes(5);
  });

  it("is idempotent: skips ceremonies whose title is already present", async () => {
    state.existingTitles = new Set(["Daily standup", "Retrospective"]);
    const svc = ceremonyService(makeDbStub(state));
    const outcome = await svc.seedDefaults("co-1", {
      agentId: null,
      userId: null,
    });
    expect(outcome.skipped.map((s) => s.slug).sort()).toEqual(
      ["daily-standup", "retrospective"].sort(),
    );
    expect(outcome.created).toHaveLength(3);
    expect(routineCreate).toHaveBeenCalledTimes(3);
  });

  it("filters to requested slugs when provided", async () => {
    const svc = ceremonyService(makeDbStub(state));
    const outcome = await svc.seedDefaults(
      "co-1",
      { agentId: null, userId: null },
      { slugs: ["sprint-planning", "sprint-review"] },
    );
    expect(outcome.created.map((c) => c.slug).sort()).toEqual([
      "sprint-planning",
      "sprint-review",
    ]);
    expect(routineCreate).toHaveBeenCalledTimes(2);
  });

  it("rejects unknown slugs in the filter", async () => {
    const svc = ceremonyService(makeDbStub(state));
    await expect(
      svc.seedDefaults(
        "co-1",
        { agentId: null, userId: null },
        { slugs: ["not-a-ceremony"] as any },
      ),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("passes assigneeAgentId through to routine.create", async () => {
    const svc = ceremonyService(makeDbStub(state));
    await svc.seedDefaults(
      "co-1",
      { agentId: "a-po", userId: null },
      { assigneeAgentId: "a-po", slugs: ["daily-standup"] },
    );
    const firstCall = routineCreate.mock.calls[0];
    expect(firstCall[1].assigneeAgentId).toBe("a-po");
    expect(firstCall[2]).toEqual({ agentId: "a-po", userId: null });
  });
});
