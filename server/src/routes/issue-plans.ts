import { Router, type Request } from "express";
import type { Db } from "@softclipai/db";
import {
  materializePlanSchema,
  requestIssuePlanSchema,
  type ApprovePlanPayload,
  type PlanProposedStory,
} from "@softclipai/shared";
import { validate } from "../middleware/validate.js";
import {
  approvalService,
  issueAcceptanceCriteriaService,
  issueApprovalService,
  issueService,
  logActivity,
} from "../services/index.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { badRequest, notFound, unprocessable } from "../errors.js";

/**
 * Plan-approval gate (workflow phase 3 → 4).
 *
 * Wraps two endpoints around the generic approvals API:
 *
 *   POST /api/issues/:issueId/plans
 *     Creates an `approve_plan` approval on a parent "planning" issue.
 *     The payload carries the Solution / Software / Data Architect
 *     sections and a list of `proposedStories`; the operator reviews
 *     the whole plan in one approval before any stories are created.
 *
 *   POST /api/approvals/:approvalId/materialize
 *     Once the plan is approved, turns its `proposedStories` into real
 *     child issues under the parent, each seeded with acceptance
 *     criteria + definition-of-done criteria. Idempotent at the
 *     approval level — a second call returns the already-materialised
 *     issue ids without creating duplicates.
 */
export function issuePlanRoutes(db: Db) {
  const router = Router();
  const approvals = approvalService(db);
  const issueApprovals = issueApprovalService(db);
  const issues = issueService(db);
  const acceptanceCriteria = issueAcceptanceCriteriaService(db);

  function actorRef(req: Request) {
    const actor = getActorInfo(req);
    return {
      agentId: actor.agentId,
      userId: actor.actorType === "user" ? actor.actorId : null,
    };
  }

  router.post(
    "/issues/:issueId/plans",
    validate(requestIssuePlanSchema),
    async (req, res) => {
      const issueId = req.params.issueId as string;
      const issue = await issues.getById(issueId);
      if (!issue) throw notFound("Issue not found");
      assertCompanyAccess(req, issue.productId);

      const body = req.body as {
        requestedByAgentId?: string | null;
        payload: ApprovePlanPayload;
      };
      const actor = getActorInfo(req);

      const approval = await approvals.create(issue.productId, {
        type: "approve_plan",
        payload: body.payload as Record<string, unknown>,
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
        productId: issue.productId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "approval.created",
        entityType: "approval",
        entityId: approval.id,
        details: { type: approval.type, issueIds: [issueId], viaPlansEndpoint: true },
      });

      res.status(201).json(approval);
    },
  );

  router.post(
    "/approvals/:approvalId/materialize",
    validate(materializePlanSchema),
    async (req, res) => {
      const approvalId = req.params.approvalId as string;
      const approval = await approvals.getById(approvalId);
      if (!approval) throw notFound("Approval not found");
      assertCompanyAccess(req, approval.productId);

      if (approval.type !== "approve_plan") {
        throw unprocessable(
          "materialize is only supported for approve_plan approvals",
        );
      }
      if (approval.status !== "approved") {
        throw unprocessable(
          "plan approval must be approved before stories can be materialised",
        );
      }

      const linkedIssues = await issueApprovals.listIssuesForApproval(approvalId);
      const parentIssue = linkedIssues[0];
      if (!parentIssue) {
        throw unprocessable("plan approval has no linked parent issue");
      }

      const payload = (approval.payload ?? {}) as ApprovePlanPayload;
      const stories: PlanProposedStory[] = Array.isArray(payload.proposedStories)
        ? payload.proposedStories
        : [];

      const body = req.body as { storyIndexes?: number[] };
      const selection =
        Array.isArray(body.storyIndexes) && body.storyIndexes.length > 0
          ? body.storyIndexes
          : stories.map((_, i) => i);

      for (const idx of selection) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= stories.length) {
          throw badRequest(`storyIndexes contains out-of-range index: ${idx}`);
        }
      }

      if (selection.length === 0) {
        throw unprocessable("plan has no proposedStories to materialise");
      }

      // Idempotency: the approval keeps a link to its parent planning
      // issue plus one link per materialised child. If any children
      // are already linked, return them rather than creating duplicates.
      const existingChildIssues = linkedIssues.filter(
        (linked) => linked.id !== parentIssue.id,
      );
      if (existingChildIssues.length > 0) {
        res.json({
          approvalId,
          parentIssueId: parentIssue.id,
          createdIssueIds: [],
          alreadyMaterialised: true,
          childIssueIds: existingChildIssues.map((i) => i.id),
        });
        return;
      }

      const actor = getActorInfo(req);
      const actorRefValue = actorRef(req);

      const createdIssueIds: string[] = [];
      for (const idx of selection) {
        const story = stories[idx];
        const created = await issues.create(approval.productId, {
          title: story.title,
          description: story.summary ?? null,
          priority: story.priority ?? "medium",
          status: "backlog",
          parentId: parentIssue.id,
          projectId: parentIssue.projectId ?? null,
          goalId: parentIssue.goalId ?? null,
          createdByAgentId: actor.actorType === "agent" ? actor.actorId : null,
          createdByUserId: actor.actorType === "user" ? actor.actorId : null,
        } as Parameters<typeof issues.create>[1]);

        const acceptanceList = Array.isArray(story.acceptanceCriteria)
          ? story.acceptanceCriteria
          : [];
        for (let order = 0; order < acceptanceList.length; order += 1) {
          await acceptanceCriteria.create(
            created.id,
            { text: acceptanceList[order], orderIndex: order },
            actorRefValue,
          );
        }

        // Definition-of-done criteria are persisted as acceptance
        // criteria too — they're prefixed `DoD:` so reviewers can
        // still visually distinguish them from product-facing ACs
        // without needing a new schema.
        const dodList = Array.isArray(story.definitionOfDone)
          ? story.definitionOfDone
          : [];
        for (let order = 0; order < dodList.length; order += 1) {
          await acceptanceCriteria.create(
            created.id,
            {
              text: `DoD: ${dodList[order]}`,
              orderIndex: acceptanceList.length + order,
            },
            actorRefValue,
          );
        }

        await issueApprovals.link(created.id, approvalId, actorRefValue);
        createdIssueIds.push(created.id);
      }

      await logActivity(db, {
        productId: approval.productId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        action: "approval.plan_materialized",
        entityType: "approval",
        entityId: approvalId,
        details: {
          parentIssueId: parentIssue.id,
          createdIssueIds,
          storyCount: createdIssueIds.length,
        },
      });

      res.status(201).json({
        approvalId,
        parentIssueId: parentIssue.id,
        createdIssueIds,
        alreadyMaterialised: false,
        childIssueIds: createdIssueIds,
      });
    },
  );

  return router;
}
