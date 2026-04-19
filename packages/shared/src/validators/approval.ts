import { z } from "zod";
import {
  APPROVAL_TYPES,
  CODE_REVIEW_APPROVAL_TYPES,
  ISSUE_PRIORITIES,
  PLAN_STORY_ROLES,
} from "../constants.js";

export const createApprovalSchema = z.object({
  type: z.enum(APPROVAL_TYPES),
  requestedByAgentId: z.string().uuid().optional().nullable(),
  payload: z.record(z.unknown()),
  issueIds: z.array(z.string().uuid()).optional(),
});

export type CreateApproval = z.infer<typeof createApprovalSchema>;

/**
 * Payload shapes for the dev-team review approval types. Fields are
 * intentionally loose — each one is optional so agents can progressively
 * enrich the request — but the schemas document what the UI knows how
 * to render and what the convenience route will normalise.
 */

const urlOrEmpty = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === "" || /^https?:\/\//.test(value),
    "Must be an http(s) URL or empty",
  )
  .optional()
  .nullable();

export const approvePrPayloadSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    summary: z.string().trim().max(4000).optional(),
    prUrl: urlOrEmpty,
    repo: z.string().trim().max(200).optional().nullable(),
    prNumber: z.number().int().positive().optional().nullable(),
    branch: z.string().trim().max(200).optional().nullable(),
    changesSummary: z.string().trim().max(4000).optional().nullable(),
    ciStatus: z.enum(["passing", "failing", "pending", "unknown"]).optional(),
    recommendedAction: z.string().trim().max(500).optional().nullable(),
  })
  .passthrough();

export type ApprovePrPayload = z.infer<typeof approvePrPayloadSchema>;

export const approveDesignPayloadSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    summary: z.string().trim().max(4000).optional(),
    wireframeUrl: urlOrEmpty,
    prototypeUrl: urlOrEmpty,
    copyReady: z.boolean().optional(),
    a11yReviewed: z.boolean().optional(),
    states: z
      .array(z.enum(["primary", "loading", "empty", "error", "disabled"]))
      .optional(),
    notes: z.string().trim().max(4000).optional().nullable(),
  })
  .passthrough();

export type ApproveDesignPayload = z.infer<typeof approveDesignPayloadSchema>;

export const approveArchitecturePayloadSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    summary: z.string().trim().max(4000).optional(),
    adrUrl: urlOrEmpty,
    tradeOffs: z.string().trim().max(4000).optional().nullable(),
    impact: z
      .enum(["new-module", "refactor", "breaking-change", "infra"])
      .optional(),
    affectedAreas: z.array(z.string().trim().max(200)).optional(),
    rollbackPlan: z.string().trim().max(2000).optional().nullable(),
  })
  .passthrough();

export type ApproveArchitecturePayload = z.infer<
  typeof approveArchitecturePayloadSchema
>;

/**
 * Payload shape for an `approve_plan` approval — the consolidated
 * architect/PO plan the operator reviews before any stories get created.
 *
 * The three architect sections are authored by the Solution / Software /
 * Data Architects respectively and then composed into a single payload.
 * `proposedStories` is the list the `/materialize` endpoint turns into
 * real issues (each with acceptance criteria + definition of done).
 *
 * Fields are loose on purpose so the architects can progressively fill
 * the plan as they iterate; the schema documents intent more than it
 * enforces completeness.
 */
export const planArchitectSectionSchema = z
  .object({
    summary: z.string().trim().max(4000).optional().nullable(),
    interfaces: z.array(z.string().trim().max(1000)).optional(),
    contracts: z.array(z.string().trim().max(1000)).optional(),
    risks: z.array(z.string().trim().max(1000)).optional(),
    authoredByAgentId: z.string().uuid().optional().nullable(),
  })
  .passthrough();

export type PlanArchitectSection = z.infer<typeof planArchitectSectionSchema>;

export const planProposedStorySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().max(4000).optional().nullable(),
    role: z.enum(PLAN_STORY_ROLES).optional(),
    priority: z.enum(ISSUE_PRIORITIES).optional(),
    acceptanceCriteria: z
      .array(z.string().trim().min(1).max(2000))
      .default([]),
    definitionOfDone: z
      .array(z.string().trim().min(1).max(2000))
      .default([]),
  })
  .passthrough();

export type PlanProposedStory = z.infer<typeof planProposedStorySchema>;

export const approvePlanPayloadSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    summary: z.string().trim().max(4000).optional(),
    solutionArchitect: planArchitectSectionSchema.optional(),
    softwareArchitect: planArchitectSectionSchema.optional(),
    dataArchitect: planArchitectSectionSchema.optional(),
    agreedInterfaces: z.array(z.string().trim().max(1000)).optional(),
    proposedStories: z.array(planProposedStorySchema).default([]),
  })
  .passthrough();

export type ApprovePlanPayload = z.infer<typeof approvePlanPayloadSchema>;

/**
 * Convenience "request a plan review" endpoint body. Mirrors
 * {@link requestIssueReviewSchema} but scoped to a single approval type.
 */
export const requestIssuePlanSchema = z.object({
  requestedByAgentId: z.string().uuid().optional().nullable(),
  payload: approvePlanPayloadSchema.default({ proposedStories: [] }),
});

export type RequestIssuePlan = z.infer<typeof requestIssuePlanSchema>;

/**
 * Body for POST /api/approvals/:id/materialize. The operator has
 * approved a plan; this turns its `proposedStories` into real issues
 * under `parentIssueId`, each seeded with acceptance criteria + DoD
 * criteria.
 *
 * If `storyIndexes` is provided, only those entries (0-indexed into
 * `proposedStories`) are materialised; otherwise every story is created.
 */
export const materializePlanSchema = z.object({
  storyIndexes: z.array(z.number().int().nonnegative()).optional(),
});

export type MaterializePlan = z.infer<typeof materializePlanSchema>;

/**
 * Convenience "request a review" endpoint body. The route reshapes this
 * into a createApproval call with the correct approval type and links
 * it to the target issue. Agents (and the UI) reach for this instead of
 * the raw approvals API for every PR / design / architecture review.
 */
export const requestIssueReviewSchema = z.object({
  reviewType: z.enum(CODE_REVIEW_APPROVAL_TYPES),
  requestedByAgentId: z.string().uuid().optional().nullable(),
  payload: z.record(z.unknown()).default({}),
});

export type RequestIssueReview = z.infer<typeof requestIssueReviewSchema>;

/**
 * Look up the payload validator for a given review type. Used by the
 * convenience route to fail with a clear per-type 400 instead of
 * accepting anything as a record.
 */
export const reviewPayloadSchemaByType = {
  approve_pr: approvePrPayloadSchema,
  approve_design: approveDesignPayloadSchema,
  approve_architecture: approveArchitecturePayloadSchema,
} as const;

export const resolveApprovalSchema = z.object({
  decisionNote: z.string().optional().nullable(),
});

export type ResolveApproval = z.infer<typeof resolveApprovalSchema>;

export const requestApprovalRevisionSchema = z.object({
  decisionNote: z.string().optional().nullable(),
});

export type RequestApprovalRevision = z.infer<typeof requestApprovalRevisionSchema>;

export const resubmitApprovalSchema = z.object({
  payload: z.record(z.unknown()).optional(),
});

export type ResubmitApproval = z.infer<typeof resubmitApprovalSchema>;

export const addApprovalCommentSchema = z.object({
  body: z.string().min(1),
});

export type AddApprovalComment = z.infer<typeof addApprovalCommentSchema>;
