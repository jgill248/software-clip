import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listGeminiSkills,
  syncGeminiSkills,
} from "@softclipai/adapter-gemini-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("gemini local skill sync", () => {
  const softclipKey = "softclipai/softclip/softclip";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Softclip skills and installs them into the Gemini skills home", async () => {
    const home = await makeTempDir("softclip-gemini-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      productId: "company-1",
      adapterType: "gemini_local",
      config: {
        env: {
          HOME: home,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    const before = await listGeminiSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(softclipKey);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.state).toBe("missing");

    const after = await syncGeminiSkills(ctx, [softclipKey]);
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".gemini", "skills", "softclip"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Softclip skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("softclip-gemini-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      productId: "company-1",
      adapterType: "gemini_local",
      config: {
        env: {
          HOME: home,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    await syncGeminiSkills(configuredCtx, [softclipKey]);

    const clearedCtx = {
      ...configuredCtx,
      config: {
        env: {
          HOME: home,
        },
        softclipSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncGeminiSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(softclipKey);
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".gemini", "skills", "softclip"))).isSymbolicLink()).toBe(true);
  });
});
