import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listClaudeSkills,
  syncClaudeSkills,
} from "@softclipai/adapter-claude-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createSkillDir(root: string, name: string) {
  const skillDir = path.join(root, name);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, "SKILL.md"), `---\nname: ${name}\n---\n`, "utf8");
  return skillDir;
}

describe("claude local skill sync", () => {
  const softclipKey = "softclipai/softclip/softclip";
  const createAgentKey = "softclipai/softclip/softclip-create-agent";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("defaults to mounting all built-in Softclip skills when no explicit selection exists", async () => {
    const snapshot = await listClaudeSkills({
      agentId: "agent-1",
      productId: "company-1",
      adapterType: "claude_local",
      config: {},
    });

    expect(snapshot.mode).toBe("ephemeral");
    expect(snapshot.supported).toBe(true);
    expect(snapshot.desiredSkills).toContain(softclipKey);
    expect(snapshot.entries.find((entry) => entry.key === softclipKey)?.required).toBe(true);
    expect(snapshot.entries.find((entry) => entry.key === softclipKey)?.state).toBe("configured");
  });

  it("respects an explicit desired skill list without mutating a persistent home", async () => {
    const snapshot = await syncClaudeSkills({
      agentId: "agent-2",
      productId: "company-1",
      adapterType: "claude_local",
      config: {
        softclipSkillSync: {
          desiredSkills: [softclipKey],
        },
      },
    }, [softclipKey]);

    expect(snapshot.desiredSkills).toContain(softclipKey);
    expect(snapshot.entries.find((entry) => entry.key === softclipKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === createAgentKey)?.state).toBe("configured");
  });

  it("normalizes legacy flat Softclip skill refs to canonical keys", async () => {
    const snapshot = await listClaudeSkills({
      agentId: "agent-3",
      productId: "company-1",
      adapterType: "claude_local",
      config: {
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

  it("shows host-level user-installed Claude skills as read-only external entries", async () => {
    const home = await makeTempDir("softclip-claude-user-skills-");
    cleanupDirs.add(home);
    await createSkillDir(path.join(home, ".claude", "skills"), "crack-python");

    const snapshot = await listClaudeSkills({
      agentId: "agent-4",
      productId: "company-1",
      adapterType: "claude_local",
      config: {
        env: {
          HOME: home,
        },
      },
    });

    expect(snapshot.entries).toContainEqual(expect.objectContaining({
      key: "crack-python",
      runtimeName: "crack-python",
      state: "external",
      managed: false,
      origin: "user_installed",
      originLabel: "User-installed",
      locationLabel: "~/.claude/skills",
      readOnly: true,
      detail: "Installed outside Softclip management in the Claude skills home.",
    }));
  });
});
