import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCodexSkills,
  syncCodexSkills,
} from "@softclipai/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("codex local skill sync", () => {
  const softclipKey = "softclipai/softclip/softclip";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Softclip skills for workspace injection on the next run", async () => {
    const codexHome = await makeTempDir("softclip-codex-skill-sync-");
    cleanupDirs.add(codexHome);

    const ctx = {
      agentId: "agent-1",
      productId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    const before = await listCodexSkills(ctx);
    expect(before.mode).toBe("ephemeral");
    expect(before.desiredSkills).toContain(softclipKey);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.state).toBe("configured");
    expect(before.entries.find((entry) => entry.key === softclipKey)?.detail).toContain("CODEX_HOME/skills/");
  });

  it("does not persist Softclip skills into CODEX_HOME during sync", async () => {
    const codexHome = await makeTempDir("softclip-codex-skill-prune-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      productId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, [softclipKey]);
    expect(after.mode).toBe("ephemeral");
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("configured");
    await expect(fs.lstat(path.join(codexHome, "skills", "softclip"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("keeps required bundled Softclip skills configured even when the desired set is emptied", async () => {
    const codexHome = await makeTempDir("softclip-codex-skill-required-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      productId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        softclipSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, []);
    expect(after.desiredSkills).toContain(softclipKey);
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("configured");
  });

  it("normalizes legacy flat Softclip skill refs before reporting configured state", async () => {
    const codexHome = await makeTempDir("softclip-codex-legacy-skill-sync-");
    cleanupDirs.add(codexHome);

    const snapshot = await listCodexSkills({
      agentId: "agent-3",
      productId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        softclipSkillSync: {
          desiredSkills: ["softclip"],
        },
      },
    });

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.desiredSkills).toContain(softclipKey);
    expect(snapshot.desiredSkills).not.toContain("softclip");
    expect(snapshot.entries.find((entry) => entry.key === softclipKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === "softclip")).toBeUndefined();
  });
});
