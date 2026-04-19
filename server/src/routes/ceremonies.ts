import { Router, type Request } from "express";
import type { Db } from "@softclipai/db";
import { seedCeremoniesSchema } from "@softclipai/shared";
import { validate } from "../middleware/validate.js";
import {
  ceremonyService,
  CEREMONY_TEMPLATES,
  logActivity,
} from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";

/**
 * Ceremony routes. The five default dev-team ceremonies (standup,
 * planning, review, retro, grooming) are instantiated as routines via
 * the ceremony service. These endpoints wrap that service:
 *
 * - GET  /ceremony-templates                         (static template list)
 * - GET  /companies/:companyId/ceremonies            (ceremonies present in product)
 * - POST /companies/:companyId/ceremonies/seed       (idempotent seed)
 */
export function ceremonyRoutes(db: Db) {
  const router = Router();
  const svc = ceremonyService(db);

  function actorRef(req: Request) {
    const actor = getActorInfo(req);
    return {
      agentId: actor.agentId,
      userId: actor.actorType === "user" ? actor.actorId : null,
    };
  }

  router.get("/ceremony-templates", (_req, res) => {
    res.json(
      CEREMONY_TEMPLATES.map((t) => ({
        slug: t.slug,
        title: t.title,
        priority: t.priority,
        description: t.description,
      })),
    );
  });

  router.get("/companies/:companyId/ceremonies", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const rows = await svc.listSeeded(companyId);
    res.json(rows);
  });

  router.post(
    "/companies/:companyId/ceremonies/seed",
    validate(seedCeremoniesSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);

      const body = req.body as {
        assigneeAgentId?: string | null;
        slugs?: readonly string[];
      };

      const outcome = await svc.seedDefaults(companyId, actorRef(req), {
        assigneeAgentId: body.assigneeAgentId ?? null,
        slugs: body.slugs,
      });

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "ceremony.seeded",
        entityType: "company",
        entityId: companyId,
        details: {
          created: outcome.created.map((c) => c.slug),
          skipped: outcome.skipped.map((c) => c.slug),
          assigneeAgentId: body.assigneeAgentId ?? null,
        },
      });

      res.status(200).json(outcome);
    },
  );

  return router;
}
