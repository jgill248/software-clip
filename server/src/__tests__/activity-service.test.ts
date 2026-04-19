import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { agents, products, createDb, heartbeatRuns } from "@softclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import { activityService } from "../services/activity.ts";

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

if (!embeddedPostgresSupport.supported) {
  console.warn(
    `Skipping embedded Postgres activity service tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
  );
}

describeEmbeddedPostgres("activity service", () => {
  let db!: ReturnType<typeof createDb>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-activity-service-");
    db = createDb(tempDb.connectionString);
  }, 20_000);

  afterEach(async () => {
    await db.delete(heartbeatRuns);
    await db.delete(agents);
    await db.delete(products);
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  it("returns compact usage and result summaries for issue runs", async () => {
    const productId = randomUUID();
    const agentId = randomUUID();
    const issueId = randomUUID();
    const runId = randomUUID();

    await db.insert(products).values({
      id: productId,
      name: "Paperclip",
      issuePrefix: `T${productId.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    });

    await db.insert(agents).values({
      id: agentId,
      productId,
      name: "CodexCoder",
      role: "engineer",
      status: "running",
      adapterType: "codex_local",
      adapterConfig: {},
      runtimeConfig: {},
      permissions: {},
    });

    await db.insert(heartbeatRuns).values({
      id: runId,
      productId,
      agentId,
      invocationSource: "assignment",
      status: "succeeded",
      contextSnapshot: { issueId },
      usageJson: {
        inputTokens: 11,
        output_tokens: 7,
        cache_read_input_tokens: 3,
        billingType: "metered",
        costUsd: 0.42,
        enormousBlob: "x".repeat(256_000),
      },
      resultJson: {
        billing_type: "metered",
        total_cost_usd: 0.42,
        summary: "done",
        nestedHuge: { payload: "y".repeat(256_000) },
      },
    });

    const runs = await activityService(db).runsForIssue(productId, issueId);

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      runId,
      agentId,
      invocationSource: "assignment",
    });
    expect(runs[0]?.usageJson).toEqual({
      inputTokens: 11,
      input_tokens: 11,
      outputTokens: 7,
      output_tokens: 7,
      cachedInputTokens: 3,
      cached_input_tokens: 3,
      cache_read_input_tokens: 3,
      billingType: "metered",
      billing_type: "metered",
      costUsd: 0.42,
      cost_usd: 0.42,
      total_cost_usd: 0.42,
    });
    expect(runs[0]?.resultJson).toEqual({
      billingType: "metered",
      billing_type: "metered",
      costUsd: 0.42,
      cost_usd: 0.42,
      total_cost_usd: 0.42,
    });
  });
});
