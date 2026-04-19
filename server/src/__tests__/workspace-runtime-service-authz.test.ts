import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  agents,
  products,
  createDb,
  executionWorkspaces,
  issues,
  projectWorkspaces,
  projects,
} from "@softclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import {
  assertCanManageExecutionWorkspaceRuntimeServices,
  assertCanManageProjectWorkspaceRuntimeServices,
} from "../routes/workspace-runtime-service-authz.js";

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

if (!embeddedPostgresSupport.supported) {
  console.warn(
    `Skipping embedded Postgres workspace runtime auth tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
  );
}

describeEmbeddedPostgres("workspace runtime service authz helper", () => {
  let db!: ReturnType<typeof createDb>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("softclip-workspace-runtime-authz-");
    db = createDb(tempDb.connectionString);
  }, 20_000);

  afterEach(async () => {
    await db.delete(issues);
    await db.delete(executionWorkspaces);
    await db.delete(projectWorkspaces);
    await db.delete(projects);
    await db.delete(agents);
    await db.delete(products);
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  async function seedCompany() {
    const productId = randomUUID();
    await db.insert(products).values({
      id: productId,
      name: "Softclip",
      issuePrefix: `PAP-${productId.slice(0, 8)}`,
    });
    return productId;
  }

  async function seedProjectWorkspace(productId: string) {
    const projectId = randomUUID();
    const projectWorkspaceId = randomUUID();
    await db.insert(projects).values({
      id: projectId,
      productId,
      name: "Workspace authz",
      status: "in_progress",
    });
    await db.insert(projectWorkspaces).values({
      id: projectWorkspaceId,
      productId,
      projectId,
      name: "Primary",
      sourceType: "local_path",
      cwd: "/tmp/softclip-authz-project",
      isPrimary: true,
    });
    return { projectId, projectWorkspaceId };
  }

  async function seedExecutionWorkspace(productId: string, projectId: string, projectWorkspaceId: string) {
    const executionWorkspaceId = randomUUID();
    await db.insert(executionWorkspaces).values({
      id: executionWorkspaceId,
      productId,
      projectId,
      projectWorkspaceId,
      mode: "isolated_workspace",
      strategyType: "git_worktree",
      name: "Execution workspace",
      status: "active",
      providerType: "local_fs",
      cwd: "/tmp/softclip-authz-execution",
    });
    return executionWorkspaceId;
  }

  async function seedAgent(
    productId: string,
    input: { role?: string; reportsTo?: string | null; name?: string } = {},
  ) {
    const agentId = randomUUID();
    await db.insert(agents).values({
      id: agentId,
      productId,
      name: input.name ?? "Agent",
      role: input.role ?? "engineer",
      reportsTo: input.reportsTo ?? null,
    });
    return agentId;
  }

  it("allows board actors to manage project workspace runtime services", async () => {
    const productId = await seedCompany();
    const { projectWorkspaceId } = await seedProjectWorkspace(productId);

    await expect(assertCanManageProjectWorkspaceRuntimeServices(db, {
      actor: {
        type: "board",
        userId: "board-1",
        productIds: [productId],
        source: "session",
        isInstanceAdmin: false,
      },
    } as any, {
      productId,
      projectWorkspaceId,
    })).resolves.toBeUndefined();
  });

  it("allows CEO agents to manage any project workspace runtime services in their company", async () => {
    const productId = await seedCompany();
    const { projectWorkspaceId } = await seedProjectWorkspace(productId);
    const ceoAgentId = await seedAgent(productId, { role: "ceo", name: "CEO" });

    await expect(assertCanManageProjectWorkspaceRuntimeServices(db, {
      actor: {
        type: "agent",
        agentId: ceoAgentId,
        productId,
        source: "agent_key",
      },
    } as any, {
      productId,
      projectWorkspaceId,
    })).resolves.toBeUndefined();
  });

  it("allows agents with a non-terminal assigned issue in the target project workspace", async () => {
    const productId = await seedCompany();
    const { projectId, projectWorkspaceId } = await seedProjectWorkspace(productId);
    const agentId = await seedAgent(productId, { name: "Engineer" });

    await db.insert(issues).values({
      id: randomUUID(),
      productId,
      projectId,
      projectWorkspaceId,
      title: "Use this workspace",
      status: "todo",
      priority: "medium",
      assigneeAgentId: agentId,
    });

    await expect(assertCanManageProjectWorkspaceRuntimeServices(db, {
      actor: {
        type: "agent",
        agentId,
        productId,
        source: "agent_key",
      },
    } as any, {
      productId,
      projectWorkspaceId,
    })).resolves.toBeUndefined();
  });

  it("allows managers to manage execution workspace runtime services for their reporting subtree", async () => {
    const productId = await seedCompany();
    const { projectId, projectWorkspaceId } = await seedProjectWorkspace(productId);
    const executionWorkspaceId = await seedExecutionWorkspace(productId, projectId, projectWorkspaceId);
    const managerId = await seedAgent(productId, { role: "cto", name: "Manager" });
    const reportId = await seedAgent(productId, { reportsTo: managerId, name: "Report" });

    await db.insert(issues).values({
      id: randomUUID(),
      productId,
      projectId,
      projectWorkspaceId,
      executionWorkspaceId,
      title: "Use execution workspace",
      status: "in_progress",
      priority: "medium",
      assigneeAgentId: reportId,
    });

    await expect(assertCanManageExecutionWorkspaceRuntimeServices(db, {
      actor: {
        type: "agent",
        agentId: managerId,
        productId,
        source: "agent_key",
      },
    } as any, {
      productId,
      executionWorkspaceId,
    })).resolves.toBeUndefined();
  });

  it("rejects unrelated same-company agents without matching workspace assignments", async () => {
    const productId = await seedCompany();
    const { projectId, projectWorkspaceId } = await seedProjectWorkspace(productId);
    const executionWorkspaceId = await seedExecutionWorkspace(productId, projectId, projectWorkspaceId);
    const assignedAgentId = await seedAgent(productId, { name: "Assigned" });
    const unrelatedAgentId = await seedAgent(productId, { name: "Unrelated" });

    await db.insert(issues).values({
      id: randomUUID(),
      productId,
      projectId,
      projectWorkspaceId,
      executionWorkspaceId,
      title: "Assigned issue",
      status: "todo",
      priority: "medium",
      assigneeAgentId: assignedAgentId,
    });

    await expect(assertCanManageExecutionWorkspaceRuntimeServices(db, {
      actor: {
        type: "agent",
        agentId: unrelatedAgentId,
        productId,
        source: "agent_key",
      },
    } as any, {
      productId,
      executionWorkspaceId,
    })).rejects.toMatchObject({
      status: 403,
      message: "Missing permission to manage workspace runtime services",
    });
  });

  it("rejects completed workspace assignments so stale issues do not keep access alive", async () => {
    const productId = await seedCompany();
    const { projectId, projectWorkspaceId } = await seedProjectWorkspace(productId);
    const agentId = await seedAgent(productId, { name: "Engineer" });

    await db.insert(issues).values({
      id: randomUUID(),
      productId,
      projectId,
      projectWorkspaceId,
      title: "Completed issue",
      status: "done",
      priority: "medium",
      assigneeAgentId: agentId,
    });

    await expect(assertCanManageProjectWorkspaceRuntimeServices(db, {
      actor: {
        type: "agent",
        agentId,
        productId,
        source: "agent_key",
      },
    } as any, {
      productId,
      projectWorkspaceId,
    })).rejects.toMatchObject({
      status: 403,
      message: "Missing permission to manage workspace runtime services",
    });
  });
});
