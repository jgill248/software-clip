import { Router, type Request } from "express";
import type { Db } from "@paperclipai/db";
import {
  assignIssueToSprintSchema,
  createSprintSchema,
  sprintStateSchema,
  updateSprintSchema,
} from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { issueService, sprintService } from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { badRequest, notFound } from "../errors.js";

/**
 * Sprint routes:
 *
 * - GET    /companies/:companyId/sprints?state=active|planned|closed
 * - GET    /companies/:companyId/sprints/active   (active or 404)
 * - POST   /companies/:companyId/sprints
 * - GET    /sprints/:id
 * - PATCH  /sprints/:id
 * - DELETE /sprints/:id                    (only while planned)
 * - GET    /sprints/:id/issues
 * - GET    /sprints/:id/summary            (counts per status)
 * - POST   /issues/:issueId/sprint         (assign / unassign)
 */
export function sprintRoutes(db: Db) {
  const router = Router();
  const svc = sprintService(db);
  const issues = issueService(db);

  function actorRef(req: Request) {
    const actor = getActorInfo(req);
    return {
      agentId: actor.agentId,
      userId: actor.actorType === "user" ? actor.actorId : null,
    };
  }

  async function requireSprintAccess(req: Request, id: string) {
    const sprint = await svc.getById(id);
    if (!sprint) throw notFound("Sprint not found");
    assertCompanyAccess(req, sprint.companyId);
    return sprint;
  }

  router.get("/companies/:companyId/sprints", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const rawState = req.query.state;
    let state: "planned" | "active" | "closed" | undefined;
    if (rawState !== undefined) {
      const parsed = sprintStateSchema.safeParse(rawState);
      if (!parsed.success) {
        throw badRequest(`Invalid state filter: ${String(rawState)}`);
      }
      state = parsed.data;
    }
    const rows = await svc.list(companyId, { state });
    res.json(rows);
  });

  router.get(
    "/companies/:companyId/sprints/active",
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const row = await svc.getActive(companyId);
      if (!row) {
        res.status(404).json({ error: "No active sprint" });
        return;
      }
      res.json(row);
    },
  );

  router.post(
    "/companies/:companyId/sprints",
    validate(createSprintSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const row = await svc.create(
        companyId,
        req.body as {
          name: string;
          goal?: string | null;
          startsAt?: string | null;
          endsAt?: string | null;
        },
        actorRef(req),
      );
      res.status(201).json(row);
    },
  );

  router.get("/sprints/:id", async (req, res) => {
    const sprint = await requireSprintAccess(req, req.params.id as string);
    res.json(sprint);
  });

  router.patch(
    "/sprints/:id",
    validate(updateSprintSchema),
    async (req, res) => {
      const id = req.params.id as string;
      await requireSprintAccess(req, id);
      const row = await svc.update(
        id,
        req.body as {
          name?: string;
          goal?: string | null;
          startsAt?: string | null;
          endsAt?: string | null;
          state?: "planned" | "active" | "closed";
        },
        actorRef(req),
      );
      res.json(row);
    },
  );

  router.delete("/sprints/:id", async (req, res) => {
    const id = req.params.id as string;
    await requireSprintAccess(req, id);
    await svc.delete(id);
    res.status(204).end();
  });

  router.get("/sprints/:id/issues", async (req, res) => {
    const id = req.params.id as string;
    await requireSprintAccess(req, id);
    const rows = await svc.listIssues(id);
    res.json(rows);
  });

  router.get("/sprints/:id/summary", async (req, res) => {
    const id = req.params.id as string;
    await requireSprintAccess(req, id);
    const summary = await svc.issueSummary(id);
    res.json(summary);
  });

  /**
   * Assign (or unassign with `sprintId: null`) an issue. We validate the
   * issue is in a product the caller can access; the service then
   * guarantees the sprint belongs to the same product.
   */
  router.post(
    "/issues/:issueId/sprint",
    validate(assignIssueToSprintSchema),
    async (req, res) => {
      const issueId = req.params.issueId as string;
      const issue = await issues.getById(issueId);
      if (!issue) throw notFound("Issue not found");
      assertCompanyAccess(req, issue.companyId);
      await svc.assignIssue(
        issueId,
        (req.body as { sprintId: string | null }).sprintId,
      );
      res.status(204).end();
    },
  );

  return router;
}
