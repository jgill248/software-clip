import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listPiSkills,
  syncPiSkills,
} from "@softclipai/adapter-pi-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("pi local skill sync", () => {
  const softclipKey = "softclipai/softclip/softclip";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Softclip skills and installs them into the Pi skills home", async () => {
    const home = await makeTempDir("softclip-pi-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      productId: "company-1",
      adapterType: "pi_local",
      config: {
        env: {
          HOME: home,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    const before = await listPiSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(softclipKey);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.state).toBe("missing");

    const after = await syncPiSkills(ctx, [softclipKey]);
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".pi", "agent", "skills", "softclip"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Softclip skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("softclip-pi-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      productId: "company-1",
      adapterType: "pi_local",
      config: {
        env: {
          HOME: home,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    await syncPiSkills(configuredCtx, [softclipKey]);

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

    const after = await syncPiSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(softclipKey);
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".pi", "agent", "skills", "softclip"))).isSymbolicLink()).toBe(true);
  });
});
