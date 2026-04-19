import { Router, type Request } from "express";
import type { Db } from "@softclipai/db";
import {
  requestIssueReviewSchema,
  reviewPayloadSchemaByType,
  type CodeReviewApprovalType,
} from "@softclipai/shared";
import { validate } from "../middleware/validate.js";
import {
  approvalService,
  issueApprovalService,
  issueService,
  logActivity,
} from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { badRequest, notFound } from "../errors.js";

/**
 * Convenience endpoint for requesting a dev-team review on an issue.
 *
 *   POST /api/issues/:issueId/reviews
 *   { reviewType: "approve_pr" | "approve_design" | "approve_architecture",
 *     payload: { ... } }
 *
 * Under the hood this wraps the generic approvals API: creates an approval
 * with the matching type, validates the payload against a per-type schema,
 * links the approval to the issue, logs the activity. Equivalent to calling
 * POST /api/companies/:companyId/approvals with the right type + issueIds,
 * but saves the caller from having to know the full approval contract.
 */
export function issueReviewRoutes(db: Db) {
  const router = Router();
  const approvals = approvalService(db);
  const issueApprovals = issueApprovalService(db);
  const issues = issueService(db);

  function actorRef(req: Request) {
    const actor = getActorInfo(req);
    return {
      agentId: actor.agentId,
      userId: actor.actorType === "user" ? actor.actorId : null,
    };
  }

  router.post(
    "/issues/:issueId/reviews",
    validate(requestIssueReviewSchema),
    async (req, res) => {
      const issueId = req.params.issueId as string;
      const issue = await issues.getById(issueId);
      if (!issue) throw notFound("Issue not found");
      assertCompanyAccess(req, issue.companyId);

      const body = req.body as {
        reviewType: CodeReviewApprovalType;
        requestedByAgentId?: string | null;
        payload: Record<string, unknown>;
      };

      const payloadSchema = reviewPayloadSchemaByType[body.reviewType];
      const payloadParsed = payloadSchema.safeParse(body.payload ?? {});
      if (!payloadParsed.success) {
        throw badRequest(
          `Invalid payload for ${body.reviewType}: ${payloadParsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
        );
      }

      const actor = getActorInfo(req);

      const approval = await approvals.create(issue.companyId, {
        type: body.reviewType,
        payload: payloadParsed.data as Record<string, unknown>,
        requestedByUserId: actor.actorType === "user" ? actor.actorId : null,
        requestedByAgentId:
          body.requestedByAgentId ??
          (actor.actorType === "agent" ? actor.actorId : null),
        status: "pending",
        decisionNote: null,
        decidedByUserId: null,
        decidedAt: null,
        updatedAt: new Date(),
      } as Parameters<typeof approvals.create>[1]);

      await issueApprovals.linkManyForApproval(approval.id, [issueId], actorRef(req));

      await logActivity(db, {
        companyId: issue.companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "approval.created",
        entityType: "approval",
        entityId: approval.id,
        details: { type: approval.type, issueIds: [issueId], viaReviewsEndpoint: true },
      });

      res.status(201).json(approval);
    },
  );

  return router;
}
