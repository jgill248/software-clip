import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCursorSkills,
  syncCursorSkills,
} from "@softclipai/adapter-cursor-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createSkillDir(root: string, name: string) {
  const skillDir = path.join(root, name);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, "SKILL.md"), `---\nname: ${name}\n---\n`, "utf8");
  return skillDir;
}

describe("cursor local skill sync", () => {
  const softclipKey = "softclipai/softclip/softclip";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Softclip skills and installs them into the Cursor skills home", async () => {
    const home = await makeTempDir("softclip-cursor-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      productId: "company-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    const before = await listCursorSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(softclipKey);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === softclipKey)?.state).toBe("missing");

    const after = await syncCursorSkills(ctx, [softclipKey]);
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "softclip"))).isSymbolicLink()).toBe(true);
  });

  it("recognizes company-library runtime skills supplied outside the bundled Softclip directory", async () => {
    const home = await makeTempDir("softclip-cursor-runtime-skills-home-");
    const runtimeSkills = await makeTempDir("softclip-cursor-runtime-skills-src-");
    cleanupDirs.add(home);
    cleanupDirs.add(runtimeSkills);

    const softclipDir = await createSkillDir(runtimeSkills, "softclip");
    const asciiHeartDir = await createSkillDir(runtimeSkills, "ascii-heart");

    const ctx = {
      agentId: "agent-3",
      productId: "company-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        softclipRuntimeSkills: [
          {
            key: "softclip",
            runtimeName: "softclip",
            source: softclipDir,
            required: true,
            requiredReason: "Bundled Softclip skills are always available for local adapters.",
          },
          {
            key: "ascii-heart",
            runtimeName: "ascii-heart",
            source: asciiHeartDir,
          },
        ],
        softclipSkillSync: {
          desiredSkills: ["ascii-heart"],
        },
      },
    } as const;

    const before = await listCursorSkills(ctx);
    expect(before.warnings).toEqual([]);
    expect(before.desiredSkills).toEqual(["softclip", "ascii-heart"]);
    expect(before.entries.find((entry) => entry.key === "ascii-heart")?.state).toBe("missing");

    const after = await syncCursorSkills(ctx, ["ascii-heart"]);
    expect(after.warnings).toEqual([]);
    expect(after.entries.find((entry) => entry.key === "ascii-heart")?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "ascii-heart"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Softclip skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("softclip-cursor-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      productId: "company-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    } as const;

    await syncCursorSkills(configuredCtx, [softclipKey]);

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

    const after = await syncCursorSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(softclipKey);
    expect(after.entries.find((entry) => entry.key === softclipKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "softclip"))).isSymbolicLink()).toBe(true);
  });
});
