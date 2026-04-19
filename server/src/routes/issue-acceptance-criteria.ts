import { Router, type Request } from "express";
import type { Db } from "@softclipai/db";
import {
  createAcceptanceCriterionSchema,
  updateAcceptanceCriterionSchema,
} from "@softclipai/shared";
import { validate } from "../middleware/validate.js";
import {
  issueAcceptanceCriteriaService,
  issueService,
} from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { notFound } from "../errors.js";

/**
 * Routes for managing issue acceptance criteria:
 *
 * - GET    /api/issues/:issueId/acceptance-criteria
 * - POST   /api/issues/:issueId/acceptance-criteria
 * - PATCH  /api/acceptance-criteria/:id
 * - DELETE /api/acceptance-criteria/:id
 *
 * The close-guard (rejecting `status = done` transitions on issues with
 * pending criteria) lives in the issues service, not here.
 */
export function issueAcceptanceCriteriaRoutes(db: Db) {
  const router = Router();
  const svc = issueAcceptanceCriteriaService(db);
  const issues = issueService(db);

  async function requireIssueAccess(req: Request, issueId: string) {
    const issue = await issues.getById(issueId);
    if (!issue) throw notFound("Issue not found");
    assertCompanyAccess(req, issue.productId);
    return issue;
  }

  async function requireCriterionAccess(req: Request, criterionId: string) {
    const row = await svc.getById(criterionId);
    if (!row) throw notFound("Acceptance criterion not found");
    await requireIssueAccess(req, row.issueId);
    return row;
  }

  router.get("/issues/:issueId/acceptance-criteria", async (req, res) => {
    const issueId = req.params.issueId as string;
    await requireIssueAccess(req, issueId);
    const rows = await svc.list(issueId);
    const summary = await svc.summarize(issueId);
    res.json({ items: rows, summary });
  });

  function actorRef(req: Request) {
    const actor = getActorInfo(req);
    return {
      agentId: actor.agentId,
      userId: actor.actorType === "user" ? actor.actorId : null,
    };
  }

  router.post(
    "/issues/:issueId/acceptance-criteria",
    validate(createAcceptanceCriterionSchema),
    async (req, res) => {
      const issueId = req.params.issueId as string;
      await requireIssueAccess(req, issueId);
      const row = await svc.create(
        issueId,
        req.body as { text: string; orderIndex?: number; status?: "pending" | "met" | "waived" },
        actorRef(req),
      );
      res.status(201).json(row);
    },
  );

  router.patch(
    "/acceptance-criteria/:id",
    validate(updateAcceptanceCriterionSchema),
    async (req, res) => {
      const id = req.params.id as string;
      await requireCriterionAccess(req, id);
      const row = await svc.update(
        id,
        req.body as {
          text?: string;
          orderIndex?: number;
          status?: "pending" | "met" | "waived";
          waivedReason?: string | null;
        },
        actorRef(req),
      );
      res.json(row);
    },
  );

  router.delete("/acceptance-criteria/:id", async (req, res) => {
    const id = req.params.id as string;
    await requireCriterionAccess(req, id);
    await svc.delete(id);
    res.status(204).end();
  });

  return router;
}
