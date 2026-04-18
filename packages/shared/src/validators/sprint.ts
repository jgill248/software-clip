import { z } from "zod";

export const SPRINT_STATES = ["planned", "active", "closed"] as const;

export const sprintStateSchema = z.enum(SPRINT_STATES);

export type SprintStateValidator = z.infer<typeof sprintStateSchema>;

/**
 * The timestamp fields are strings on the wire (ISO 8601); validators
 * coerce them to Date inside the service layer. Leaving as optional
 * strings here keeps the JSON contract straightforward for the UI.
 */
export const createSprintSchema = z.object({
  name: z.string().trim().min(1).max(200),
  goal: z.string().trim().max(4000).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export type CreateSprint = z.infer<typeof createSprintSchema>;

export const updateSprintSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  goal: z.string().trim().max(4000).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  // State is optional on update; setting it triggers a transition the
  // service will validate (planned -> active -> closed only).
  state: sprintStateSchema.optional(),
});

export type UpdateSprint = z.infer<typeof updateSprintSchema>;

export const assignIssueToSprintSchema = z.object({
  sprintId: z.string().uuid().nullable(),
});

export type AssignIssueToSprint = z.infer<typeof assignIssueToSprintSchema>;
