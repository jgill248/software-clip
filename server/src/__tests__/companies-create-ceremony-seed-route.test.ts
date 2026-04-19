import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCompanyService = vi.hoisted(() => ({
  create: vi.fn(),
}));

const mockAccessService = vi.hoisted(() => ({
  ensureMembership: vi.fn(),
  hasPermission: vi.fn(),
}));

const mockCeremonyService = vi.hoisted(() => ({
  seedDefaults: vi.fn(),
}));

const mockAgentService = vi.hoisted(() => ({
  create: vi.fn(),
}));

const mockAgentInstructionsService = vi.hoisted(() => ({
  materializeManagedBundle: vi.fn(),
}));

const mockFeedbackService = vi.hoisted(() => ({}));
const mockLogActivity = vi.hoisted(() => vi.fn());
const mockLoadBundle = vi.hoisted(() => vi.fn());

vi.mock("../services/index.js", () => ({
  accessService: () => mockAccessService,
  agentInstructionsService: () => mockAgentInstructionsService,
  agentService: () => mockAgentService,
  ceremonyService: () => mockCeremonyService,
  companyService: () => mockCompanyService,
  feedbackService: () => mockFeedbackService,
  logActivity: mockLogActivity,
}));

vi.mock("../services/default-agent-instructions.js", () => ({
  loadDefaultAgentInstructionsBundle: mockLoadBundle,
  resolveDefaultAgentInstructionsBundleRole: (role: string) => role,
}));

async function createApp(actor: Record<string, unknown>) {
  const [{ companyRoutes }, { errorHandler }] = await Promise.all([
    vi.importActual<typeof import("../routes/companies.js")>("../routes/companies.js"),
    vi.importActual<typeof import("../middleware/index.js")>("../middleware/index.js"),
  ]);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as { actor: unknown }).actor = actor;
    next();
  });
  app.use("/api/companies", companyRoutes({} as never));
  app.use(errorHandler);
  return app;
}

describe("POST /api/companies bootstraps a Product Owner + ceremonies (§10)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCompanyService.create.mockResolvedValue({
      id: "company-new",
      name: "Example Product",
    });
    mockAccessService.ensureMembership.mockResolvedValue(undefined);
    mockLogActivity.mockResolvedValue(undefined);
    mockAgentService.create.mockResolvedValue({
      id: "agent-po",
      name: "Product Owner",
      role: "product-owner",
      companyId: "company-new",
      adapterType: "process",
      adapterConfig: {},
    });
    mockLoadBundle.mockResolvedValue({
      "AGENTS.md": "# PO",
      "HEARTBEAT.md": "",
      "SOUL.md": "",
      "TOOLS.md": "",
    });
    mockAgentInstructionsService.materializeManagedBundle.mockResolvedValue({
      bundle: {},
      adapterConfig: {},
    });
    mockCeremonyService.seedDefaults.mockResolvedValue({
      created: [
        { slug: "daily-standup", routineId: "routine-1" },
        { slug: "sprint-planning", routineId: "routine-2" },
        { slug: "sprint-review", routineId: "routine-3" },
        { slug: "retrospective", routineId: "routine-4" },
        { slug: "backlog-grooming", routineId: "routine-5" },
      ],
      skipped: [],
    });
  });

  it("creates a Product Owner, materializes the PO bundle, and assigns ceremonies to them", async () => {
    const app = await createApp({
      type: "board",
      source: "local_implicit",
      userId: "user-1",
      isInstanceAdmin: true,
    });

    const res = await request(app)
      .post("/api/companies")
      .send({ name: "Example Product" });

    expect(res.status).toBe(201);
    expect(mockCompanyService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Example Product" }),
    );
    expect(mockAgentService.create).toHaveBeenCalledWith(
      "company-new",
      expect.objectContaining({
        name: "Product Owner",
        role: "product-owner",
        reportsTo: null,
      }),
    );
    expect(mockLoadBundle).toHaveBeenCalledWith("product-owner");
    expect(mockAgentInstructionsService.materializeManagedBundle)
      .toHaveBeenCalledWith(
        expect.objectContaining({ id: "agent-po" }),
        expect.objectContaining({ "AGENTS.md": "# PO" }),
        expect.objectContaining({ entryFile: "AGENTS.md" }),
      );
    expect(mockCeremonyService.seedDefaults).toHaveBeenCalledWith(
      "company-new",
      { agentId: null, userId: "user-1" },
      { assigneeAgentId: "agent-po" },
    );
  });

  it("still seeds ceremonies (unassigned) when PO creation fails", async () => {
    mockAgentService.create.mockRejectedValueOnce(new Error("db down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const app = await createApp({
      type: "board",
      source: "local_implicit",
      userId: "user-1",
      isInstanceAdmin: true,
    });

    const res = await request(app)
      .post("/api/companies")
      .send({ name: "Example Product" });

    expect(res.status).toBe(201);
    expect(mockCeremonyService.seedDefaults).toHaveBeenCalledWith(
      "company-new",
      { agentId: null, userId: "user-1" },
      undefined,
    );
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("still returns 201 even if ceremony seeding fails", async () => {
    mockCeremonyService.seedDefaults.mockRejectedValueOnce(new Error("boom"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const app = await createApp({
      type: "board",
      source: "local_implicit",
      userId: "user-1",
      isInstanceAdmin: true,
    });

    const res = await request(app)
      .post("/api/companies")
      .send({ name: "Example Product" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "company-new" });
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
