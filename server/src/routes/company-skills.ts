import { Router, type Request } from "express";
import type { Db } from "@softclipai/db";
import {
  companySkillCreateSchema,
  companySkillFileUpdateSchema,
  companySkillImportSchema,
  companySkillProjectScanRequestSchema,
} from "@softclipai/shared";
import { trackSkillImported } from "@softclipai/shared/telemetry";
import { validate } from "../middleware/validate.js";
import { accessService, agentService, companySkillService, logActivity } from "../services/index.js";
import { forbidden } from "../errors.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { getTelemetryClient } from "../telemetry.js";

type SkillTelemetryInput = {
  key: string;
  slug: string;
  sourceType: string;
  sourceLocator: string | null;
  metadata: Record<string, unknown> | null;
};

export function companySkillRoutes(db: Db) {
  const router = Router();
  const agents = agentService(db);
  const access = accessService(db);
  const svc = companySkillService(db);

  function canCreateAgents(agent: { permissions: Record<string, unknown> | null | undefined }) {
    if (!agent.permissions || typeof agent.permissions !== "object") return false;
    return Boolean((agent.permissions as Record<string, unknown>).canCreateAgents);
  }

  function asString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function deriveTrackedSkillRef(skill: SkillTelemetryInput): string | null {
    if (skill.sourceType === "skills_sh") {
      return skill.key;
    }
    if (skill.sourceType !== "github") {
      return null;
    }
    const hostname = asString(skill.metadata?.hostname);
    if (hostname !== "github.com") {
      return null;
    }
    return skill.key;
  }

  async function assertCanMutateCompanySkills(req: Request, productId: string) {
    assertCompanyAccess(req, productId);

    if (req.actor.type === "board") {
      if (req.actor.source === "local_implicit" || req.actor.isInstanceAdmin) return;
      const allowed = await access.canUser(productId, req.actor.userId, "agents:create");
      if (!allowed) {
        throw forbidden("Missing permission: agents:create");
      }
      return;
    }

    if (!req.actor.agentId) {
      throw forbidden("Agent authentication required");
    }

    const actorAgent = await agents.getById(req.actor.agentId);
    if (!actorAgent || actorAgent.productId !== productId) {
      throw forbidden("Agent key cannot access another company");
    }

    const allowedByGrant = await access.hasPermission(productId, "agent", actorAgent.id, "agents:create");
    if (allowedByGrant || canCreateAgents(actorAgent)) {
      return;
    }

    throw forbidden("Missing permission: can create agents");
  }

  router.get("/products/:productId/skills", async (req, res) => {
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);
    const result = await svc.list(productId);
    res.json(result);
  });

  router.get("/products/:productId/skills/:skillId", async (req, res) => {
    const productId = req.params.productId as string;
    const skillId = req.params.skillId as string;
    assertCompanyAccess(req, productId);
    const result = await svc.detail(productId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    res.json(result);
  });

  router.get("/products/:productId/skills/:skillId/update-status", async (req, res) => {
    const productId = req.params.productId as string;
    const skillId = req.params.skillId as string;
    assertCompanyAccess(req, productId);
    const result = await svc.updateStatus(productId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    res.json(result);
  });

  router.get("/products/:productId/skills/:skillId/files", async (req, res) => {
    const productId = req.params.productId as string;
    const skillId = req.params.skillId as string;
    const relativePath = String(req.query.path ?? "SKILL.md");
    assertCompanyAccess(req, productId);
    const result = await svc.readFile(productId, skillId, relativePath);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    res.json(result);
  });

  router.post(
    "/products/:productId/skills",
    validate(companySkillCreateSchema),
    async (req, res) => {
      const productId = req.params.productId as string;
      await assertCanMutateCompanySkills(req, productId);
      const result = await svc.createLocalSkill(productId, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        productId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skill_created",
        entityType: "company_skill",
        entityId: result.id,
        details: {
          slug: result.slug,
          name: result.name,
        },
      });

      res.status(201).json(result);
    },
  );

  router.patch(
    "/products/:productId/skills/:skillId/files",
    validate(companySkillFileUpdateSchema),
    async (req, res) => {
      const productId = req.params.productId as string;
      const skillId = req.params.skillId as string;
      await assertCanMutateCompanySkills(req, productId);
      const result = await svc.updateFile(
        productId,
        skillId,
        String(req.body.path ?? ""),
        String(req.body.content ?? ""),
      );

      const actor = getActorInfo(req);
      await logActivity(db, {
        productId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skill_file_updated",
        entityType: "company_skill",
        entityId: skillId,
        details: {
          path: result.path,
          markdown: result.markdown,
        },
      });

      res.json(result);
    },
  );

  router.post(
    "/products/:productId/skills/import",
    validate(companySkillImportSchema),
    async (req, res) => {
      const productId = req.params.productId as string;
      await assertCanMutateCompanySkills(req, productId);
      const source = String(req.body.source ?? "");
      const result = await svc.importFromSource(productId, source);

      const actor = getActorInfo(req);
      await logActivity(db, {
        productId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skills_imported",
        entityType: "company",
        entityId: productId,
        details: {
          source,
          importedCount: result.imported.length,
          importedSlugs: result.imported.map((skill) => skill.slug),
          warningCount: result.warnings.length,
        },
      });
      const telemetryClient = getTelemetryClient();
      if (telemetryClient) {
        for (const skill of result.imported) {
          trackSkillImported(telemetryClient, {
            sourceType: skill.sourceType,
            skillRef: deriveTrackedSkillRef(skill),
          });
        }
      }

      res.status(201).json(result);
    },
  );

  router.post(
    "/products/:productId/skills/scan-projects",
    validate(companySkillProjectScanRequestSchema),
    async (req, res) => {
      const productId = req.params.productId as string;
      await assertCanMutateCompanySkills(req, productId);
      const result = await svc.scanProjectWorkspaces(productId, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        productId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skills_scanned",
        entityType: "company",
        entityId: productId,
        details: {
          scannedProjects: result.scannedProjects,
          scannedWorkspaces: result.scannedWorkspaces,
          discovered: result.discovered,
          importedCount: result.imported.length,
          updatedCount: result.updated.length,
          conflictCount: result.conflicts.length,
          warningCount: result.warnings.length,
        },
      });

      res.json(result);
    },
  );

  router.delete("/products/:productId/skills/:skillId", async (req, res) => {
    const productId = req.params.productId as string;
    const skillId = req.params.skillId as string;
    await assertCanMutateCompanySkills(req, productId);
    const result = await svc.deleteSkill(productId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    const actor = getActorInfo(req);
    await logActivity(db, {
      productId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.skill_deleted",
      entityType: "company_skill",
      entityId: result.id,
      details: {
        slug: result.slug,
        name: result.name,
      },
    });

    res.json(result);
  });

  router.post("/products/:productId/skills/:skillId/install-update", async (req, res) => {
    const productId = req.params.productId as string;
    const skillId = req.params.skillId as string;
    await assertCanMutateCompanySkills(req, productId);
    const result = await svc.installUpdate(productId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    const actor = getActorInfo(req);
    await logActivity(db, {
      productId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.skill_update_installed",
      entityType: "company_skill",
      entityId: result.id,
      details: {
        slug: result.slug,
        sourceRef: result.sourceRef,
      },
    });

    res.json(result);
  });

  return router;
}
