import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { productRoutes } from "../routes/products.js";

vi.mock("../services/index.js", () => ({
  productService: () => ({
    list: vi.fn(),
    stats: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    remove: vi.fn(),
  }),
  accessService: () => ({
    canUser: vi.fn(),
    ensureMembership: vi.fn(),
  }),
  agentService: () => ({
    create: vi.fn(),
  }),
  agentInstructionsService: () => ({
    materializeManagedBundle: vi.fn(),
  }),
  ceremonyService: () => ({
    seedDefaults: vi.fn(),
  }),
  feedbackService: () => ({
    listIssueVotesForUser: vi.fn(),
    listFeedbackTraces: vi.fn(),
    getFeedbackTraceById: vi.fn(),
    saveIssueVote: vi.fn(),
  }),
  logActivity: vi.fn(),
}));

vi.mock("../services/default-agent-instructions.js", () => ({
  loadDefaultAgentInstructionsBundle: vi.fn().mockResolvedValue({}),
  resolveDefaultAgentInstructionsBundleRole: (role: string) => role,
}));

describe("company routes malformed issue path guard", () => {
  it("returns a clear error when productId is missing for issues list path", async () => {
    const app = express();
    app.use((req, _res, next) => {
      (req as any).actor = {
        type: "agent",
        agentId: "agent-1",
        productId: "company-1",
        source: "agent_key",
      };
      next();
    });
    app.use("/api/products", productRoutes({} as any));

    const res = await request(app).get("/api/products/issues");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Missing productId in path. Use /api/products/{productId}/issues.",
    });
  });
});
