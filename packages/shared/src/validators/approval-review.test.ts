import { describe, expect, it } from "vitest";
import {
  approveArchitecturePayloadSchema,
  approveDesignPayloadSchema,
  approvePlanPayloadSchema,
  approvePrPayloadSchema,
  materializePlanSchema,
  planProposedStorySchema,
  requestIssuePlanSchema,
  requestIssueReviewSchema,
  reviewPayloadSchemaByType,
} from "./approval.js";

describe("approvePrPayloadSchema", () => {
  it("accepts a minimal payload", () => {
    expect(
      approvePrPayloadSchema.parse({ summary: "Adds CSV export" }),
    ).toMatchObject({ summary: "Adds CSV export" });
  });

  it("accepts an http(s) prUrl", () => {
    const parsed = approvePrPayloadSchema.parse({
      prUrl: "https://github.com/foo/bar/pull/42",
    });
    expect(parsed.prUrl).toBe("https://github.com/foo/bar/pull/42");
  });

  it("rejects a non-http prUrl", () => {
    const result = approvePrPayloadSchema.safeParse({
      prUrl: "ftp://example.com/file",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive prNumber", () => {
    expect(
      approvePrPayloadSchema.safeParse({ prNumber: -1 }).success,
    ).toBe(false);
    expect(
      approvePrPayloadSchema.safeParse({ prNumber: 0 }).success,
    ).toBe(false);
    expect(
      approvePrPayloadSchema.safeParse({ prNumber: 42 }).success,
    ).toBe(true);
  });

  it("accepts only known ciStatus values", () => {
    expect(
      approvePrPayloadSchema.safeParse({ ciStatus: "passing" }).success,
    ).toBe(true);
    expect(
      approvePrPayloadSchema.safeParse({ ciStatus: "broken" }).success,
    ).toBe(false);
  });

  it("passes through unknown keys (progressive enrichment)", () => {
    const parsed = approvePrPayloadSchema.parse({
      summary: "x",
      customField: "keep me",
    });
    expect((parsed as Record<string, unknown>).customField).toBe("keep me");
  });
});

describe("approveDesignPayloadSchema", () => {
  it("accepts known state names only", () => {
    expect(
      approveDesignPayloadSchema.safeParse({
        states: ["primary", "loading", "error"],
      }).success,
    ).toBe(true);
    expect(
      approveDesignPayloadSchema.safeParse({ states: ["on-fire"] }).success,
    ).toBe(false);
  });

  it("accepts booleans for copyReady and a11yReviewed", () => {
    const parsed = approveDesignPayloadSchema.parse({
      copyReady: true,
      a11yReviewed: false,
    });
    expect(parsed.copyReady).toBe(true);
    expect(parsed.a11yReviewed).toBe(false);
  });
});

describe("approveArchitecturePayloadSchema", () => {
  it("accepts known impact values only", () => {
    expect(
      approveArchitecturePayloadSchema.safeParse({
        impact: "breaking-change",
      }).success,
    ).toBe(true);
    expect(
      approveArchitecturePayloadSchema.safeParse({ impact: "cosmetic" })
        .success,
    ).toBe(false);
  });

  it("accepts an array of affected areas", () => {
    const parsed = approveArchitecturePayloadSchema.parse({
      affectedAreas: ["packages/shared", "server/src/routes"],
    });
    expect(parsed.affectedAreas).toEqual([
      "packages/shared",
      "server/src/routes",
    ]);
  });
});

describe("requestIssueReviewSchema", () => {
  it("accepts each review type", () => {
    for (const reviewType of [
      "approve_pr",
      "approve_design",
      "approve_architecture",
    ] as const) {
      const parsed = requestIssueReviewSchema.parse({
        reviewType,
        payload: { summary: "x" },
      });
      expect(parsed.reviewType).toBe(reviewType);
    }
  });

  it("rejects non-review approval types", () => {
    expect(
      requestIssueReviewSchema.safeParse({
        reviewType: "hire_agent",
        payload: {},
      }).success,
    ).toBe(false);
  });

  it("defaults payload to empty object when omitted", () => {
    const parsed = requestIssueReviewSchema.parse({
      reviewType: "approve_pr",
    });
    expect(parsed.payload).toEqual({});
  });
});

describe("reviewPayloadSchemaByType lookup", () => {
  it("maps each type to its schema", () => {
    expect(reviewPayloadSchemaByType.approve_pr).toBe(approvePrPayloadSchema);
    expect(reviewPayloadSchemaByType.approve_design).toBe(
      approveDesignPayloadSchema,
    );
    expect(reviewPayloadSchemaByType.approve_architecture).toBe(
      approveArchitecturePayloadSchema,
    );
  });
});

describe("planProposedStorySchema", () => {
  it("requires a non-empty title", () => {
    expect(
      planProposedStorySchema.safeParse({ title: "", acceptanceCriteria: [] })
        .success,
    ).toBe(false);
    expect(
      planProposedStorySchema.safeParse({ title: "Ship feed" }).success,
    ).toBe(true);
  });

  it("defaults acceptance criteria and DoD to empty arrays", () => {
    const parsed = planProposedStorySchema.parse({ title: "Ship feed" });
    expect(parsed.acceptanceCriteria).toEqual([]);
    expect(parsed.definitionOfDone).toEqual([]);
  });

  it("rejects an unknown role", () => {
    expect(
      planProposedStorySchema.safeParse({
        title: "Ship feed",
        role: "janitor",
      }).success,
    ).toBe(false);
  });

  it("accepts every seeded plan-story role", () => {
    for (const role of [
      "product_owner",
      "solution_architect",
      "software_architect",
      "data_architect",
      "designer",
      "engineer",
      "qa",
      "security",
      "devops",
    ] as const) {
      expect(
        planProposedStorySchema.safeParse({ title: "Ship feed", role }).success,
      ).toBe(true);
    }
  });
});

describe("approvePlanPayloadSchema", () => {
  it("accepts an empty plan (architects still drafting)", () => {
    const parsed = approvePlanPayloadSchema.parse({});
    expect(parsed.proposedStories).toEqual([]);
  });

  it("accepts a fully populated plan", () => {
    const parsed = approvePlanPayloadSchema.parse({
      title: "Add reviewer roster",
      summary: "Add a first-pass reviewer roster to issue detail",
      solutionArchitect: {
        summary: "Integrations unchanged",
        interfaces: [],
      },
      softwareArchitect: {
        summary: "New service module",
        interfaces: ["reviewerRosterService.pick(issueId)"],
      },
      dataArchitect: {
        summary: "Uses existing reviewers table",
        interfaces: [],
      },
      agreedInterfaces: ["GET /api/issues/:id/reviewer-suggestions"],
      proposedStories: [
        {
          title: "Service wiring",
          role: "engineer",
          acceptanceCriteria: ["Returns suggestions"],
          definitionOfDone: ["Unit tests pass"],
        },
      ],
    });
    expect(parsed.proposedStories).toHaveLength(1);
    expect(parsed.proposedStories[0].acceptanceCriteria).toEqual([
      "Returns suggestions",
    ]);
  });

  it("passes through unknown keys for progressive enrichment", () => {
    const parsed = approvePlanPayloadSchema.parse({
      title: "Plan",
      customSection: { notes: "keep me" },
    });
    expect(
      (parsed as Record<string, unknown>).customSection,
    ).toEqual({ notes: "keep me" });
  });
});

describe("requestIssuePlanSchema", () => {
  it("accepts a minimal body and defaults proposedStories", () => {
    const parsed = requestIssuePlanSchema.parse({});
    expect(parsed.payload.proposedStories).toEqual([]);
  });

  it("rejects a non-UUID requestedByAgentId", () => {
    expect(
      requestIssuePlanSchema.safeParse({
        requestedByAgentId: "not-a-uuid",
        payload: {},
      }).success,
    ).toBe(false);
  });
});

describe("materializePlanSchema", () => {
  it("accepts an empty body (materialise all stories)", () => {
    const parsed = materializePlanSchema.parse({});
    expect(parsed.storyIndexes).toBeUndefined();
  });

  it("accepts explicit storyIndexes", () => {
    const parsed = materializePlanSchema.parse({ storyIndexes: [0, 2] });
    expect(parsed.storyIndexes).toEqual([0, 2]);
  });

  it("rejects negative storyIndexes", () => {
    expect(
      materializePlanSchema.safeParse({ storyIndexes: [-1] }).success,
    ).toBe(false);
  });

  it("rejects non-integer storyIndexes", () => {
    expect(
      materializePlanSchema.safeParse({ storyIndexes: [1.5] }).success,
    ).toBe(false);
  });
});
