import { describe, expect, it } from "vitest";
import {
  approveArchitecturePayloadSchema,
  approveDesignPayloadSchema,
  approvePrPayloadSchema,
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
