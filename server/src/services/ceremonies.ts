import { and, eq } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { routines } from "@paperclipai/db";
import type { CreateRoutine } from "@paperclipai/shared";
import { routineService } from "./routines.js";
import { notFound, unprocessable } from "../errors.js";

/**
 * Default ceremonies every new software-dev product ships with. Each is
 * instantiated as a Routine — the agent-facing prompt lives in the
 * `description` so whoever runs the ceremony knows exactly what to do.
 *
 * No schedule is attached by default. Cadence varies by team, so we
 * leave triggers to the PO to configure once the team's rhythm is clear.
 * The routines land in `draft` status unless an assigneeAgentId is passed
 * to `seedDefaults`, which then marks them `active` and ready to fire.
 */

export interface CeremonyTemplate {
  slug: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export const CEREMONY_TEMPLATES: readonly CeremonyTemplate[] = [
  {
    slug: "daily-standup",
    title: "Daily standup",
    priority: "medium",
    description: `Run the team's daily async standup.

For each agent with in-flight work, surface:
- What shipped since the last standup
- What's actively in progress today
- What's blocked, and by what

Produce: one comment on the active sprint issue (or on the standup
ceremony issue itself if no sprint is active) with:

- a one-line status per report
- a list of blockers needing human attention

If the PO is running this, also check:
- any new issues at the top of the backlog needing acceptance criteria
- any approvals older than 24h waiting on a team member`,
  },
  {
    slug: "sprint-planning",
    title: "Sprint planning",
    priority: "high",
    description: `Plan the next sprint.

Steps:
1. Close the previous sprint if it's still active (all committed
   issues should be \`done\`, \`cancelled\`, or rolled over).
2. Create the next sprint with a clear goal in one sentence.
3. Select committed issues from the top of the backlog. Each must
   have acceptance criteria written before it's committed.
4. Mark 1–2 stretch issues if capacity allows.
5. Publish the sprint goal and commitments as a comment on the
   new sprint's issue.

Product Owner leads; everyone else confirms capacity and flags risks
during the ceremony.`,
  },
  {
    slug: "sprint-review",
    title: "Sprint review",
    priority: "medium",
    description: `Review what shipped this sprint.

For each \`done\` issue in the active sprint:
- Confirm the Definition of Done (acceptance criteria all met/waived,
  tests landed, PR merged).
- Summarise the user-visible change in one line.

For each issue NOT done (still \`in_progress\`, \`in_review\`, or
\`blocked\`):
- State whether it rolls to next sprint or drops.

Produce a single comment on the sprint issue with:
- shipped items (linked)
- not shipped items (linked + disposition)
- a one-sentence sprint-goal hit/miss verdict

Run this before the retrospective.`,
  },
  {
    slug: "retrospective",
    title: "Retrospective",
    priority: "medium",
    description: `Sprint retrospective.

Collect from the team (as comments on this ceremony's issue):
- What went well — continue doing
- What didn't go well — stop doing
- What to try — experiments for the next sprint

File any concrete follow-ups as new issues with label \`retro\`
(e.g., "adopt conventional commits", "replace flaky e2e #4"). Don't
leave ideas in the retrospective comment stream — they'll die there.

Keep it to 20 minutes of team attention. Candor beats ceremony.`,
  },
  {
    slug: "backlog-grooming",
    title: "Backlog grooming",
    priority: "low",
    description: `Mid-sprint grooming of the backlog.

Pass through the top 10–15 issues in the backlog and for each:
- Does it still matter? (if not, close)
- Does it have clear acceptance criteria? (if not, the PO writes them
  or pushes it back out of the planning zone)
- Is it the right size? (if not, split)
- Does it have the right assignee role? (if not, reassign)

Product Owner drives. Output is a groomed top-of-backlog that's ready
for the next sprint-planning ceremony without further prep.`,
  },
] as const;

export type CeremonySlug = (typeof CEREMONY_TEMPLATES)[number]["slug"];

export function getCeremonyTemplate(slug: string): CeremonyTemplate | null {
  return CEREMONY_TEMPLATES.find((t) => t.slug === slug) ?? null;
}

interface SeedActor {
  agentId?: string | null;
  userId?: string | null;
}

interface SeedOptions {
  /** If provided, seeded routines are assigned to this agent and activated. */
  assigneeAgentId?: string | null;
  /** Optional subset of slugs to seed; defaults to all templates. */
  slugs?: readonly string[];
}

export interface SeedOutcome {
  created: { slug: string; routineId: string }[];
  skipped: { slug: string; reason: "already-exists"; routineId: string }[];
}

export function ceremonyService(db: Db) {
  const routineSvc = routineService(db);

  async function findExistingByTitle(companyId: string, title: string) {
    const rows = await db
      .select({ id: routines.id })
      .from(routines)
      .where(
        and(eq(routines.companyId, companyId), eq(routines.title, title)),
      );
    return rows[0] ?? null;
  }

  return {
    templates: CEREMONY_TEMPLATES,

    /**
     * Seed the default ceremonies into a company. Idempotent: skips any
     * ceremony whose title already exists for this company. Returns a
     * per-slug breakdown so the caller can report what changed.
     */
    seedDefaults: async (
      companyId: string,
      actor: SeedActor,
      options: SeedOptions = {},
    ): Promise<SeedOutcome> => {
      const slugFilter = options.slugs ? new Set(options.slugs) : null;
      if (slugFilter) {
        for (const slug of slugFilter) {
          if (!getCeremonyTemplate(slug)) {
            throw unprocessable(`Unknown ceremony slug: ${slug}`);
          }
        }
      }

      const outcome: SeedOutcome = { created: [], skipped: [] };

      for (const template of CEREMONY_TEMPLATES) {
        if (slugFilter && !slugFilter.has(template.slug)) continue;

        const existing = await findExistingByTitle(companyId, template.title);
        if (existing) {
          outcome.skipped.push({
            slug: template.slug,
            reason: "already-exists",
            routineId: existing.id,
          });
          continue;
        }

        const input: CreateRoutine = {
          title: template.title,
          description: template.description,
          assigneeAgentId: options.assigneeAgentId ?? null,
          priority: template.priority,
          // Routine service coerces to "draft" when no assignee is set;
          // passing "active" here is harmless — normalizeDraftRoutineStatus
          // handles the demotion.
          status: "active",
          concurrencyPolicy: "coalesce_if_active",
          catchUpPolicy: "skip_missed",
          variables: [],
        };

        const routine = await routineSvc.create(companyId, input, {
          agentId: actor.agentId ?? null,
          userId: actor.userId ?? null,
        });
        outcome.created.push({ slug: template.slug, routineId: routine.id });
      }

      return outcome;
    },

    /**
     * List the ceremonies (routines matching one of the default ceremony
     * titles) present in a company. Handy for the UI to detect whether a
     * product has ceremonies configured yet.
     */
    listSeeded: async (companyId: string) => {
      const titles = CEREMONY_TEMPLATES.map((t) => t.title);
      const rows = await db
        .select({
          id: routines.id,
          title: routines.title,
          status: routines.status,
          assigneeAgentId: routines.assigneeAgentId,
        })
        .from(routines)
        .where(eq(routines.companyId, companyId));
      return rows
        .filter((row) => titles.includes(row.title))
        .map((row) => ({
          ...row,
          slug:
            CEREMONY_TEMPLATES.find((t) => t.title === row.title)?.slug ??
            null,
        }));
    },

    /**
     * Return a specific template by slug. Exposed for routes/tests that
     * want to inspect the prompt before seeding.
     */
    getTemplate: (slug: string) => {
      const template = getCeremonyTemplate(slug);
      if (!template) throw notFound(`Ceremony template not found: ${slug}`);
      return template;
    },
  };
}

export type CeremonyService = ReturnType<typeof ceremonyService>;
