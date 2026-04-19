import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApprovalService = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  requestRevision: vi.fn(),
  resubmit: vi.fn(),
  listComments: vi.fn(),
  addComment: vi.fn(),
}));

const mockIssueApprovalService = vi.hoisted(() => ({
  listIssuesForApproval: vi.fn(),
  linkManyForApproval: vi.fn(),
  link: vi.fn(),
}));

const mockIssueService = vi.hoisted(() => ({
  getById: vi.fn(),
  create: vi.fn(),
}));

const mockAcceptanceCriteriaService = vi.hoisted(() => ({
  create: vi.fn(),
}));

const mockLogActivity = vi.hoisted(() => vi.fn());

vi.mock("../services/index.js", () => ({
  approvalService: () => mockApprovalService,
  issueApprovalService: () => mockIssueApprovalService,
  issueService: () => mockIssueService,
  issueAcceptanceCriteriaService: () => mockAcceptanceCriteriaService,
  logActivity: mockLogActivity,
}));

function registerModuleMocks() {
  vi.doMock("../services/index.js", () => ({
    approvalService: () => mockApprovalService,
    issueApprovalService: () => mockIssueApprovalService,
    issueService: () => mockIssueService,
    issueAcceptanceCriteriaService: () => mockAcceptanceCriteriaService,
    logActivity: mockLogActivity,
  }));
}

async function createApp(actorOverrides: Record<string, unknown> = {}) {
  const [{ errorHandler }, { issuePlanRoutes }] = await Promise.all([
    vi.importActual<typeof import("../middleware/index.js")>("../middleware/index.js"),
    vi.importActual<typeof import("../routes/issue-plans.js")>(
      "../routes/issue-plans.js",
    ),
  ]);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).actor = {
      type: "board",
      userId: "user-1",
      productIds: ["company-1"],
      source: "session",
      isInstanceAdmin: false,
      ...actorOverrides,
    };
    next();
  });
  app.use("/api", issuePlanRoutes({} as any));
  app.use(errorHandler);
  return app;
}

describe("POST /api/issues/:issueId/plans", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("../routes/issue-plans.js");
    vi.doUnmock("../middleware/index.js");
    registerModuleMocks();
    vi.resetAllMocks();
    mockLogActivity.mockResolvedValue(undefined);
    mockIssueApprovalService.linkManyForApproval.mockResolvedValue(undefined);
  });

  it("creates an approve_plan approval linked to the parent issue", async () => {
    mockIssueService.getById.mockResolvedValue({
      id: "issue-parent",
      productId: "company-1",
    });
    mockApprovalService.create.mockResolvedValue({
      id: "approval-1",
      productId: "company-1",
      type: "approve_plan",
      status: "pending",
      payload: { proposedStories: [] },
    });

    const res = await request(await createApp())
      .post("/api/issues/issue-parent/plans")
      .send({
        payload: {
          title: "Reviewer roster",
          proposedStories: [{ title: "Wire service", acceptanceCriteria: [] }],
        },
      });

    expect(res.status).toBe(201);
    expect(mockApprovalService.create).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ type: "approve_plan", status: "pending" }),
    );
    expect(mockIssueApprovalService.linkManyForApproval).toHaveBeenCalledWith(
      "approval-1",
      ["issue-parent"],
      expect.any(Object),
    );
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "approval.created",
        entityType: "approval",
        entityId: "approval-1",
        details: expect.objectContaining({ viaPlansEndpoint: true }),
      }),
    );
  });

  it("returns 404 when the parent issue is missing", async () => {
    mockIssueService.getById.mockResolvedValue(null);

    const res = await request(await createApp())
      .post("/api/issues/missing/plans")
      .send({ payload: {} });

    expect(res.status).toBe(404);
    expect(mockApprovalService.create).not.toHaveBeenCalled();
  });

  it("rejects callers without access to the parent's company", async () => {
    mockIssueService.getById.mockResolvedValue({
      id: "issue-parent",
      productId: "company-other",
    });

    const res = await request(await createApp())
      .post("/api/issues/issue-parent/plans")
      .send({ payload: {} });

    expect(res.status).toBe(403);
    expect(mockApprovalService.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/approvals/:id/materialize", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("../routes/issue-plans.js");
    vi.doUnmock("../middleware/index.js");
    registerModuleMocks();
    vi.resetAllMocks();
    mockLogActivity.mockResolvedValue(undefined);
    mockIssueApprovalService.link.mockResolvedValue({});
  });

  it("materialises approved plan stories as child issues with AC + DoD", async () => {
    mockApprovalService.getById.mockResolvedValue({
      id: "approval-1",
      productId: "company-1",
      type: "approve_plan",
      status: "approved",
      payload: {
        proposedStories: [
          {
            title: "Wire service",
            summary: "Stand up reviewerRosterService",
            acceptanceCriteria: ["Service returns top 3 reviewers"],
            definitionOfDone: ["Unit tests pass"],
          },
          {
            title: "UI badge",
            acceptanceCriteria: [],
            definitionOfDone: ["Visible on issue detail"],
          },
        ],
      },
    });
    mockIssueApprovalService.listIssuesForApproval.mockResolvedValue([
      { id: "issue-parent", projectId: "project-1", goalId: null },
    ]);
    let issueCounter = 0;
    mockIssueService.create.mockImplementation(async () => ({
      id: `issue-new-${++issueCounter}`,
    }));
    mockAcceptanceCriteriaService.create.mockResolvedValue({});

    const res = await request(await createApp())
      .post("/api/approvals/approval-1/materialize")
      .send({});

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      approvalId: "approval-1",
      parentIssueId: "issue-parent",
      alreadyMaterialised: false,
      createdIssueIds: ["issue-new-1", "issue-new-2"],
    });

    // Story 1 → one AC + one DoD (prefixed), story 2 → zero AC + one DoD.
    expect(mockAcceptanceCriteriaService.create).toHaveBeenCalledTimes(3);
    const createCalls = mockAcceptanceCriteriaService.create.mock.calls;
    expect(createCalls[0][1]).toMatchObject({
      text: "Service returns top 3 reviewers",
    });
    expect(createCalls[1][1]).toMatchObject({ text: "DoD: Unit tests pass" });
    expect(createCalls[2][1]).toMatchObject({
      text: "DoD: Visible on issue detail",
    });

    expect(mockIssueApprovalService.link).toHaveBeenCalledTimes(2);
  });

  it("is idempotent: a second call returns the existing child issue ids", async () => {
    mockApprovalService.getById.mockResolvedValue({
      id: "approval-1",
      productId: "company-1",
      type: "approve_plan",
      status: "approved",
      payload: {
        proposedStories: [{ title: "x", acceptanceCriteria: [], definitionOfDone: [] }],
      },
    });
    mockIssueApprovalService.listIssuesForApproval.mockResolvedValue([
      { id: "issue-parent", projectId: null, goalId: null },
      { id: "issue-child-1", projectId: null, goalId: null },
    ]);

    const res = await request(await createApp())
      .post("/api/approvals/approval-1/materialize")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      alreadyMaterialised: true,
      childIssueIds: ["issue-child-1"],
      createdIssueIds: [],
    });
    expect(mockIssueService.create).not.toHaveBeenCalled();
  });

  it("rejects materialise when the approval type is not approve_plan", async () => {
    mockApprovalService.getById.mockResolvedValue({
      id: "approval-1",
      productId: "company-1",
      type: "approve_pr",
      status: "approved",
      payload: {},
    });

    const res = await request(await createApp())
      .post("/api/approvals/approval-1/materialize")
      .send({});

    expect(res.status).toBe(422);
    expect(mockIssueService.create).not.toHaveBeenCalled();
  });

  it("rejects materialise when the plan is not yet approved", async () => {
    mockApprovalService.getById.mockResolvedValue({
      id: "approval-1",
      productId: "company-1",
      type: "approve_plan",
      status: "pending",
      payload: { proposedStories: [{ title: "x", acceptanceCriteria: [] }] },
    });

    const res = await request(await createApp())
      .post("/api/approvals/approval-1/materialize")
      .send({});

    expect(res.status).toBe(422);
    expect(mockIssueService.create).not.toHaveBeenCalled();
  });

  it("rejects materialise with out-of-range storyIndexes", async () => {
    mockApprovalService.getById.mockResolvedValue({
      id: "approval-1",
      productId: "company-1",
      type: "approve_plan",
      status: "approved",
      payload: {
        proposedStories: [{ title: "only", acceptanceCriteria: [] }],
      },
    });
    mockIssueApprovalService.listIssuesForApproval.mockResolvedValue([
      { id: "issue-parent", projectId: null, goalId: null },
    ]);

    const res = await request(await createApp())
      .post("/api/approvals/approval-1/materialize")
      .send({ storyIndexes: [5] });

    expect(res.status).toBe(400);
    expect(mockIssueService.create).not.toHaveBeenCalled();
  });
});
