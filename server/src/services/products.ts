import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { Db } from "@softclipai/db";
import {
  products,
  // Softclip pivot §6: companyLogos removed. `assets` is still needed
  // for cleanup on company delete (non-logo uploads).
  assets,
  agents,
  agentApiKeys,
  agentRuntimeState,
  agentTaskSessions,
  agentWakeupRequests,
  issues,
  issueComments,
  projects,
  goals,
  heartbeatRuns,
  heartbeatRunEvents,
  costEvents,
  issueReadStates,
  approvalComments,
  approvals,
  activityLog,
  companySecrets,
  joinRequests,
  invites,
  principalPermissionGrants,
  companyMemberships,
  companySkills,
} from "@softclipai/db";
import { notFound } from "../errors.js";

export function productService(db: Db) {
  const ISSUE_PREFIX_FALLBACK = "CMP";

  const companySelection = {
    id: products.id,
    name: products.name,
    description: products.description,
    status: products.status,
    issuePrefix: products.issuePrefix,
    issueCounter: products.issueCounter,
    budgetMonthlyCents: products.budgetMonthlyCents,
    spentMonthlyCents: products.spentMonthlyCents,
    feedbackDataSharingEnabled: products.feedbackDataSharingEnabled,
    feedbackDataSharingConsentAt: products.feedbackDataSharingConsentAt,
    feedbackDataSharingConsentByUserId: products.feedbackDataSharingConsentByUserId,
    feedbackDataSharingTermsVersion: products.feedbackDataSharingTermsVersion,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  };

  // Softclip pivot §6: enrichCompany (logoUrl synthesis) removed with
  // the logoAssetId/logoUrl fields.

  function currentUtcMonthWindow(now = new Date()) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    return {
      start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0)),
    };
  }

  async function getMonthlySpendByCompanyIds(
    productIds: string[],
    database: Pick<Db, "select"> = db,
  ) {
    if (productIds.length === 0) return new Map<string, number>();
    const { start, end } = currentUtcMonthWindow();
    const rows = await database
        .select({
          productId: costEvents.productId,
          spentMonthlyCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::double precision`,
        })
      .from(costEvents)
      .where(
        and(
          inArray(costEvents.productId, productIds),
          gte(costEvents.occurredAt, start),
          lt(costEvents.occurredAt, end),
        ),
      )
      .groupBy(costEvents.productId);
    return new Map(rows.map((row) => [row.productId, Number(row.spentMonthlyCents ?? 0)]));
  }

  async function hydrateCompanySpend<T extends { id: string; spentMonthlyCents: number }>(
    rows: T[],
    database: Pick<Db, "select"> = db,
  ) {
    const spendByCompanyId = await getMonthlySpendByCompanyIds(rows.map((row) => row.id), database);
    return rows.map((row) => ({
      ...row,
      spentMonthlyCents: spendByCompanyId.get(row.id) ?? 0,
    }));
  }

  function getCompanyQuery(database: Pick<Db, "select">) {
    return database
      .select(companySelection)
      .from(products);
    // Softclip pivot §6: leftJoin on companyLogos removed.
  }

  function deriveIssuePrefixBase(name: string) {
    const normalized = name.toUpperCase().replace(/[^A-Z]/g, "");
    return normalized.slice(0, 3) || ISSUE_PREFIX_FALLBACK;
  }

  function suffixForAttempt(attempt: number) {
    if (attempt <= 1) return "";
    return "A".repeat(attempt - 1);
  }

  function isIssuePrefixConflict(error: unknown) {
    const constraint = typeof error === "object" && error !== null && "constraint" in error
      ? (error as { constraint?: string }).constraint
      : typeof error === "object" && error !== null && "constraint_name" in error
        ? (error as { constraint_name?: string }).constraint_name
        : undefined;
    return typeof error === "object"
      && error !== null
      && "code" in error
      && (error as { code?: string }).code === "23505"
      && constraint === "companies_issue_prefix_idx";
  }

  async function createCompanyWithUniquePrefix(data: typeof products.$inferInsert) {
    const base = deriveIssuePrefixBase(data.name);
    let suffix = 1;
    while (suffix < 10000) {
      const candidate = `${base}${suffixForAttempt(suffix)}`;
      try {
        const rows = await db
          .insert(products)
          .values({ ...data, issuePrefix: candidate })
          .returning();
        return rows[0];
      } catch (error) {
        if (!isIssuePrefixConflict(error)) throw error;
      }
      suffix += 1;
    }
    throw new Error("Unable to allocate unique issue prefix");
  }

  return {
    list: async () => {
      const rows = await getCompanyQuery(db);
      return hydrateCompanySpend(rows);
    },

    getById: async (id: string) => {
      const row = await getCompanyQuery(db)
        .where(eq(products.id, id))
        .then((rows) => rows[0] ?? null);
      if (!row) return null;
      const [hydrated] = await hydrateCompanySpend([row], db);
      return hydrated;
    },

    create: async (data: typeof products.$inferInsert) => {
      const created = await createCompanyWithUniquePrefix(data);
      const row = await getCompanyQuery(db)
        .where(eq(products.id, created.id))
        .then((rows) => rows[0] ?? null);
      if (!row) throw notFound("Company not found after creation");
      const [hydrated] = await hydrateCompanySpend([row], db);
      return hydrated;
    },

    // Softclip pivot §6: update() used to accept a synthetic
    // logoAssetId alongside the column patch so it could manage the
    // company_logos join row. Branding is gone, so this is now a
    // plain update.
    update: (id: string, data: Partial<typeof products.$inferInsert>) =>
      db.transaction(async (tx) => {
        const existing = await getCompanyQuery(tx)
          .where(eq(products.id, id))
          .then((rows) => rows[0] ?? null);
        if (!existing) return null;

        const updated = await tx
          .update(products)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(products.id, id))
          .returning()
          .then((rows) => rows[0] ?? null);
        if (!updated) return null;

        const [hydrated] = await hydrateCompanySpend([updated], tx);
        return hydrated;
      }),

    archive: (id: string) =>
      db.transaction(async (tx) => {
        const updated = await tx
          .update(products)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(products.id, id))
          .returning()
          .then((rows) => rows[0] ?? null);
        if (!updated) return null;
        const row = await getCompanyQuery(tx)
          .where(eq(products.id, id))
          .then((rows) => rows[0] ?? null);
        if (!row) return null;
        const [hydrated] = await hydrateCompanySpend([row], tx);
        return hydrated;
      }),

    remove: (id: string) =>
      db.transaction(async (tx) => {
        // Delete from child tables in dependency order
        await tx.delete(heartbeatRunEvents).where(eq(heartbeatRunEvents.productId, id));
        await tx.delete(agentTaskSessions).where(eq(agentTaskSessions.productId, id));
        await tx.delete(activityLog).where(eq(activityLog.productId, id));
        await tx.delete(heartbeatRuns).where(eq(heartbeatRuns.productId, id));
        await tx.delete(agentWakeupRequests).where(eq(agentWakeupRequests.productId, id));
        await tx.delete(agentApiKeys).where(eq(agentApiKeys.productId, id));
        await tx.delete(agentRuntimeState).where(eq(agentRuntimeState.productId, id));
        await tx.delete(issueComments).where(eq(issueComments.productId, id));
        await tx.delete(costEvents).where(eq(costEvents.productId, id));
        // Softclip pivot §6: financeEvents table removed.
        await tx.delete(approvalComments).where(eq(approvalComments.productId, id));
        await tx.delete(approvals).where(eq(approvals.productId, id));
        await tx.delete(companySecrets).where(eq(companySecrets.productId, id));
        await tx.delete(joinRequests).where(eq(joinRequests.productId, id));
        await tx.delete(invites).where(eq(invites.productId, id));
        await tx.delete(principalPermissionGrants).where(eq(principalPermissionGrants.productId, id));
        await tx.delete(companyMemberships).where(eq(companyMemberships.productId, id));
        await tx.delete(companySkills).where(eq(companySkills.productId, id));
        await tx.delete(issueReadStates).where(eq(issueReadStates.productId, id));
        await tx.delete(issues).where(eq(issues.productId, id));
        // Softclip pivot §6: company_logos table gone; just clean up
        // any remaining assets on delete.
        await tx.delete(assets).where(eq(assets.productId, id));
        await tx.delete(goals).where(eq(goals.productId, id));
        await tx.delete(projects).where(eq(projects.productId, id));
        await tx.delete(agents).where(eq(agents.productId, id));
        const rows = await tx
          .delete(products)
          .where(eq(products.id, id))
          .returning();
        return rows[0] ?? null;
      }),

    stats: () =>
      Promise.all([
        db
          .select({ productId: agents.productId, count: count() })
          .from(agents)
          .groupBy(agents.productId),
        db
          .select({ productId: issues.productId, count: count() })
          .from(issues)
          .groupBy(issues.productId),
      ]).then(([agentRows, issueRows]) => {
        const result: Record<string, { agentCount: number; issueCount: number }> = {};
        for (const row of agentRows) {
          result[row.productId] = { agentCount: row.count, issueCount: 0 };
        }
        for (const row of issueRows) {
          if (result[row.productId]) {
            result[row.productId].issueCount = row.count;
          } else {
            result[row.productId] = { agentCount: 0, issueCount: row.count };
          }
        }
        return result;
      }),
  };
}
