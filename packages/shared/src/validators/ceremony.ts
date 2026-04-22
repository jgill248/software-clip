import { z } from "zod";

export const CEREMONY_SLUGS = [
  "daily-standup",
  "sprint-planning",
  "sprint-review",
  "retrospective",
  "backlog-grooming",
] as const;

export const ceremonySlugSchema = z.enum(CEREMONY_SLUGS);

export type CeremonySlugValidator = z.infer<typeof ceremonySlugSchema>;

/**
 * Body for POST /api/products/:productId/ceremonies/seed.
 *
 * - `assigneeAgentId`: optional Product Owner (or equivalent) who will own
 *   the seeded ceremonies. When provided the ceremonies land active; when
 *   omitted they land as drafts for the caller to assign later.
 * - `slugs`: optional subset of ceremonies to seed. Defaults to all five.
 */
export const seedCeremoniesSchema = z.object({
  assigneeAgentId: z.string().uuid().nullable().optional(),
  slugs: z.array(ceremonySlugSchema).nonempty().optional(),
});

export type SeedCeremonies = z.infer<typeof seedCeremoniesSchema>;
