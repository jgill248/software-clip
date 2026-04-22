import { Router } from "express";
import type { Db } from "@softclipai/db";
import {
  DEFAULT_FEEDBACK_DATA_SHARING_TERMS_VERSION,
  createCompanySchema,
  feedbackTargetTypeSchema,
  feedbackTraceStatusSchema,
  feedbackVoteValueSchema,
  // Softclip pivot §6: updateCompanyBrandingSchema removed.
  updateCompanySchema,
} from "@softclipai/shared";
import { badRequest, forbidden } from "../errors.js";
import { validate } from "../middleware/validate.js";
import {
  accessService,
  agentInstructionsService,
  agentService,
  ceremonyService,
  productService,
  feedbackService,
  logActivity,
} from "../services/index.js";
import {
  loadDefaultAgentInstructionsBundle,
  resolveDefaultAgentInstructionsBundleRole,
} from "../services/default-agent-instructions.js";
import type { StorageService } from "../storage/types.js";
import { assertBoard, assertCompanyAccess, getActorInfo } from "./authz.js";

export function productRoutes(db: Db, _storage?: StorageService) {
  const router = Router();
  const svc = productService(db);
  const access = accessService(db);
  const feedback = feedbackService(db);
  const ceremonies = ceremonyService(db);
  const agents = agentService(db);
  const instructions = agentInstructionsService();

  function parseBooleanQuery(value: unknown) {
    return value === true || value === "true" || value === "1";
  }

  function parseDateQuery(value: unknown, field: string) {
    if (typeof value !== "string" || value.trim().length === 0) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw badRequest(`Invalid ${field} query value`);
    }
    return parsed;
  }


  router.get("/", async (req, res) => {
    assertBoard(req);
    const result = await svc.list();
    if (req.actor.source === "local_implicit" || req.actor.isInstanceAdmin) {
      res.json(result);
      return;
    }
    const allowed = new Set(req.actor.productIds ?? []);
    res.json(result.filter((company) => allowed.has(company.id)));
  });

  router.get("/stats", async (req, res) => {
    assertBoard(req);
    const allowed = req.actor.source === "local_implicit" || req.actor.isInstanceAdmin
      ? null
      : new Set(req.actor.productIds ?? []);
    const stats = await svc.stats();
    if (!allowed) {
      res.json(stats);
      return;
    }
    const filtered = Object.fromEntries(Object.entries(stats).filter(([productId]) => allowed.has(productId)));
    res.json(filtered);
  });

  // Common malformed path when productId is empty in "/api/products/{productId}/issues".
  router.get("/issues", (_req, res) => {
    res.status(400).json({
      error: "Missing productId in path. Use /api/products/{productId}/issues.",
    });
  });

  router.get("/:productId", async (req, res) => {
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);
    // Allow agents (CEO) to read their own company; board always allowed
    if (req.actor.type !== "agent") {
      assertBoard(req);
    }
    const company = await svc.getById(productId);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(company);
  });

  router.get("/:productId/feedback-traces", async (req, res) => {
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);
    assertBoard(req);

    const targetTypeRaw = typeof req.query.targetType === "string" ? req.query.targetType : undefined;
    const voteRaw = typeof req.query.vote === "string" ? req.query.vote : undefined;
    const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
    const issueId = typeof req.query.issueId === "string" && req.query.issueId.trim().length > 0 ? req.query.issueId : undefined;
    const projectId = typeof req.query.projectId === "string" && req.query.projectId.trim().length > 0
      ? req.query.projectId
      : undefined;

    const traces = await feedback.listFeedbackTraces({
      productId,
      issueId,
      projectId,
      targetType: targetTypeRaw ? feedbackTargetTypeSchema.parse(targetTypeRaw) : undefined,
      vote: voteRaw ? feedbackVoteValueSchema.parse(voteRaw) : undefined,
      status: statusRaw ? feedbackTraceStatusSchema.parse(statusRaw) : undefined,
      from: parseDateQuery(req.query.from, "from"),
      to: parseDateQuery(req.query.to, "to"),
      sharedOnly: parseBooleanQuery(req.query.sharedOnly),
      includePayload: parseBooleanQuery(req.query.includePayload),
    });
    res.json(traces);
  });

  router.post("/", validate(createCompanySchema), async (req, res) => {
    assertBoard(req);
    if (!(req.actor.source === "local_implicit" || req.actor.isInstanceAdmin)) {
      throw forbidden("Instance admin required");
    }
    const company = await svc.create(req.body);
    await access.ensureMembership(company.id, "user", req.actor.userId ?? "local-board", "owner", "active");
    await logActivity(db, {
      productId: company.id,
      actorType: "user",
      actorId: req.actor.userId ?? "board",
      action: "company.created",
      entityType: "company",
      entityId: company.id,
      details: { name: company.name },
    });

    // Softclip pivot §10: every new product lands with a Product Owner
    // already hired and the five default ceremonies assigned to them.
    // The PO is the root agent (reportsTo: null) and ships with the full
    // product-owner instruction bundle. If either step fails, log and
    // move on — the product is still usable; the user can hire the PO
    // and seed ceremonies manually.
    let productOwnerAgentId: string | null = null;
    try {
      const productOwner = await agents.create(company.id, {
        name: "Product Owner",
        role: "product-owner",
        title: "Product Owner",
        reportsTo: null,
        adapterType: "process",
        adapterConfig: {},
      });
      productOwnerAgentId = productOwner.id;

      const bundleFiles = await loadDefaultAgentInstructionsBundle(
        resolveDefaultAgentInstructionsBundleRole("product-owner"),
      );
      await instructions.materializeManagedBundle(
        productOwner,
        bundleFiles,
        { entryFile: "AGENTS.md", replaceExisting: false },
      );
    } catch (err) {
      console.error("[softclip] product-owner seed failed on product create", {
        productId: company.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      await ceremonies.seedDefaults(
        company.id,
        {
          agentId: null,
          userId: req.actor.userId ?? null,
        },
        productOwnerAgentId ? { assigneeAgentId: productOwnerAgentId } : undefined,
      );
    } catch (err) {
      console.error("[softclip] ceremony seed failed on product create", {
        productId: company.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Softclip pivot §6: dev teams don't run on dollar budgets, so we
    // no longer auto-seed a budget_policies row at product creation.
    // budgetMonthlyCents on the product row is still accepted for backward
    // compatibility with imported companies but is not enforced anywhere.
    res.status(201).json(company);
  });

  router.patch("/:productId", async (req, res) => {
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);

    const actor = getActorInfo(req);
    const existingCompany = await svc.getById(productId);
    if (!existingCompany) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    let body: Record<string, unknown>;

    if (req.actor.type === "agent") {
      // Softclip pivot §6: branding (logos + brand color) removed. The
      // agent-facing CEO-only branding update path is gone; agents no
      // longer mutate company settings directly.
      throw forbidden("Agent callers may not update company settings");
    } else {
      assertBoard(req);
      body = updateCompanySchema.parse(req.body);

      if (body.feedbackDataSharingEnabled === true && !existingCompany.feedbackDataSharingEnabled) {
        body = {
          ...body,
          feedbackDataSharingConsentAt: new Date(),
          feedbackDataSharingConsentByUserId: req.actor.userId ?? "local-board",
          feedbackDataSharingTermsVersion:
            typeof body.feedbackDataSharingTermsVersion === "string" && body.feedbackDataSharingTermsVersion.length > 0
              ? body.feedbackDataSharingTermsVersion
              : DEFAULT_FEEDBACK_DATA_SHARING_TERMS_VERSION,
        };
      }
    }

    const company = await svc.update(productId, body);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    await logActivity(db, {
      productId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.updated",
      entityType: "company",
      entityId: productId,
      details: body,
    });
    res.json(company);
  });

  // Softclip pivot §6: PATCH /branding endpoint removed along with
  // the logo/brand-color UI and the CEO-only assertCanUpdateBranding
  // helper.

  router.post("/:productId/archive", async (req, res) => {
    assertBoard(req);
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);
    const company = await svc.archive(productId);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    await logActivity(db, {
      productId,
      actorType: "user",
      actorId: req.actor.userId ?? "board",
      action: "company.archived",
      entityType: "company",
      entityId: productId,
    });
    res.json(company);
  });

  router.delete("/:productId", async (req, res) => {
    assertBoard(req);
    const productId = req.params.productId as string;
    assertCompanyAccess(req, productId);
    const company = await svc.remove(productId);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json({ ok: true });
  });

  return router;
}
