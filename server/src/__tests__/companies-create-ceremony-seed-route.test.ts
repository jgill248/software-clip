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

const mockFeedbackService = vi.hoisted(() => ({}));
const mockLogActivity = vi.hoisted(() => vi.fn());

vi.mock("../services/index.js", () => ({
  accessService: () => mockAccessService,
  ceremonyService: () => mockCeremonyService,
  companyService: () => mockCompanyService,
  feedbackService: () => mockFeedbackService,
  logActivity: mockLogActivity,
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

describe("POST /api/companies seeds default ceremonies (§10)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCompanyService.create.mockResolvedValue({
      id: "company-new",
      name: "Example Product",
    });
    mockAccessService.ensureMembership.mockResolvedValue(undefined);
    mockLogActivity.mockResolvedValue(undefined);
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

  it("seeds the five default ceremonies for the newly created product", async () => {
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
    expect(mockCeremonyService.seedDefaults).toHaveBeenCalledWith(
      "company-new",
      { agentId: null, userId: "user-1" },
    );
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
