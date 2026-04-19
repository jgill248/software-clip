import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  agents,
  approvals,
  createDb,
  issueApprovals,
  issues,
  products,
} from "@softclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import { issueService } from "../services/issues.ts";

/**
 * Plan-approval gate: once a parent issue has an `approve_plan` approval in
 * a non-terminal state (pending / revision_requested), the issue service
 * must refuse to create child issues manually. The /materialize endpoint
 * only runs after the plan is approved, so it passes this check naturally
 * — the test confirms approved / rejected / cancelled all let child
 * creation through while pending / revision_requested blocks it.
 */

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported
  ? describe
  : describe.skip;

async function ensureIssueRelationsTable(db: ReturnType<typeof createDb>) {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "issue_relations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "company_id" uuid NOT NULL,
      "issue_id" uuid NOT NULL,
      "related_issue_id" uuid NOT NULL,
      "type" text NOT NULL,
      "created_by_agent_id" uuid,
      "created_by_user_id" text,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
  `));
}

if (!embeddedPostgresSupport.supported) {
  // eslint-disable-next-line no-console
  console.warn(
    `Skipping embedded Postgres plan-gate tests on this host: ${
      embeddedPostgresSupport.reason ?? "unsupported environment"
    }`,
  );
}

describeEmbeddedPostgres("issueService.create — plan-approval gate", () => {
  let db!: ReturnType<typeof createDb>;
  let svc!: ReturnType<typeof issueService>;
  let tempDb: Awaited<
    ReturnType<typeof startEmbeddedPostgresTestDatabase>
  > | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase(
      "softclip-plan-gate-",
    );
    db = createDb(tempDb.connectionString);
    svc = issueService(db);
    await ensureIssueRelationsTable(db);
  }, 20_000);

  afterEach(async () => {
    await db.delete(issueApprovals);
    await db.delete(approvals);
    await db.delete(issues);
    await db.delete(agents);
    await db.delete(products);
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  async function seedPlanningIssue(): Promise<{
    productId: string;
    parentIssueId: string;
  }> {
    const productId = randomUUID();
    const parentIssueId = randomUUID();
    await db.insert(products).values({
      id: productId,
      name: "Softclip test",
      issuePrefix: `T${productId.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    });
    await db.insert(issues).values({
      id: parentIssueId,
      productId,
      title: "Planning issue",
      status: "backlog",
      priority: "medium",
    });
    return { productId, parentIssueId };
  }

  async function createPlanApproval(
    productId: string,
    parentIssueId: string,
    status: "pending" | "revision_requested" | "approved" | "rejected" | "cancelled",
  ): Promise<string> {
    const approvalId = randomUUID();
    await db.insert(approvals).values({
      id: approvalId,
      productId,
      type: "approve_plan",
      status,
      payload: { proposedStories: [] },
      requestedByUserId: "user-1",
    });
    await db.insert(issueApprovals).values({
      productId,
      issueId: parentIssueId,
      approvalId,
    });
    return approvalId;
  }

  it("allows child creation when the parent has no approve_plan approval", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();

    const child = await svc.create(productId, {
      parentId: parentIssueId,
      title: "Ad-hoc subtask",
      status: "backlog",
      priority: "medium",
    });

    expect(child.id).toBeTruthy();
    expect(child.parentId).toBe(parentIssueId);
  });

  it("blocks child creation while an approve_plan is pending", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();
    const approvalId = await createPlanApproval(
      productId,
      parentIssueId,
      "pending",
    );

    await expect(
      svc.create(productId, {
        parentId: parentIssueId,
        title: "Blocked story",
        status: "backlog",
        priority: "medium",
      }),
    ).rejects.toMatchObject({
      status: 409,
      details: { approvalId, approvalStatus: "pending" },
    });
  });

  it("blocks child creation while an approve_plan is in revision_requested", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();
    const approvalId = await createPlanApproval(
      productId,
      parentIssueId,
      "revision_requested",
    );

    await expect(
      svc.create(productId, {
        parentId: parentIssueId,
        title: "Still blocked",
        status: "backlog",
        priority: "medium",
      }),
    ).rejects.toMatchObject({
      status: 409,
      details: { approvalId, approvalStatus: "revision_requested" },
    });
  });

  it("allows child creation once the approve_plan is approved", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();
    await createPlanApproval(productId, parentIssueId, "approved");

    const child = await svc.create(productId, {
      parentId: parentIssueId,
      title: "Materialised story",
      status: "backlog",
      priority: "medium",
    });

    expect(child.id).toBeTruthy();
  });

  it("allows child creation after the approve_plan is rejected (follow-up work)", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();
    await createPlanApproval(productId, parentIssueId, "rejected");

    const child = await svc.create(productId, {
      parentId: parentIssueId,
      title: "Post-rejection one-off",
      status: "backlog",
      priority: "medium",
    });

    expect(child.id).toBeTruthy();
  });

  it("allows child creation after the approve_plan is cancelled", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();
    await createPlanApproval(productId, parentIssueId, "cancelled");

    const child = await svc.create(productId, {
      parentId: parentIssueId,
      title: "Post-cancel one-off",
      status: "backlog",
      priority: "medium",
    });

    expect(child.id).toBeTruthy();
  });

  it("allows top-level issue creation regardless of any other in-flight plans", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();
    await createPlanApproval(productId, parentIssueId, "pending");

    // No parentId → the plan gate should not fire at all.
    const topLevel = await svc.create(productId, {
      title: "Unrelated top-level issue",
      status: "backlog",
      priority: "medium",
    });

    expect(topLevel.id).toBeTruthy();
    expect(topLevel.parentId).toBeNull();
  });

  it("unblocks a second child once the pending plan is later approved", async () => {
    const { productId, parentIssueId } = await seedPlanningIssue();
    const approvalId = await createPlanApproval(
      productId,
      parentIssueId,
      "pending",
    );

    await expect(
      svc.create(productId, {
        parentId: parentIssueId,
        title: "First attempt",
        status: "backlog",
        priority: "medium",
      }),
    ).rejects.toMatchObject({ status: 409 });

    // Flip the plan to approved, simulating the operator signing off.
    await db
      .update(approvals)
      .set({ status: "approved" })
      .where(sql`${approvals.id} = ${approvalId}`);

    const child = await svc.create(productId, {
      parentId: parentIssueId,
      title: "Second attempt",
      status: "backlog",
      priority: "medium",
    });

    expect(child.id).toBeTruthy();
  });
});
