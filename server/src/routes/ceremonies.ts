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
 * - GET  /products/:productId/ceremonies            (ceremonies present in product)
 * - POST /products/:productId/ceremonies/seed       (idempotent seed)
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

  router.get("/products/:productId/ceremonies", async (req, res) => {
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);
    const rows = await svc.listSeeded(productId);
    res.json(rows);
  });

  router.post(
    "/products/:productId/ceremonies/seed",
    validate(seedCeremoniesSchema),
    async (req, res) => {
      const productId = req.params.productId as string;
      assertCompanyAccess(req, productId);

      const body = req.body as {
        assigneeAgentId?: string | null;
        slugs?: readonly string[];
      };

      const outcome = await svc.seedDefaults(productId, actorRef(req), {
        assigneeAgentId: body.assigneeAgentId ?? null,
        slugs: body.slugs,
      });

      const actor = getActorInfo(req);
      await logActivity(db, {
        productId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "ceremony.seeded",
        entityType: "company",
        entityId: productId,
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
