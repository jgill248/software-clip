import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(HERE, "..", "onboarding-assets");

/**
 * Default roles that ship with Softclip. Each must have the full five-file
 * bundle. The "_template" directory is a stub scaffolding source and must
 * also be complete. The "ceo" directory is a legacy bundle retained during
 * the Softclip pivot; it is allowed to exist but is not validated here.
 */
const DEFAULT_ROLE_DIRS = [
  "_template",
  "product-owner",
  "software-architect",
  "solution-architect",
  "data-architect",
  "designer",
  "engineer",
  "qa",
  "security",
  "devops",
];

const REQUIRED_FILES = [
  "README.md",
  "AGENTS.md",
  "HEARTBEAT.md",
  "SOUL.md",
  "TOOLS.md",
];

/**
 * These headings (loose match, case-insensitive) must appear in every AGENTS.md
 * so agents and humans can rely on structural sections being present. We test
 * the content, not the exact capitalisation, so humans can reword headings
 * as long as the concept is covered.
 */
const REQUIRED_AGENTS_MD_SECTIONS: Array<{ concept: string; patterns: RegExp[] }> = [
  { concept: "role and scope", patterns: [/role\s+and\s+scope/i, /^##\s+scope/im] },
  { concept: "delegation", patterns: [/##\s+delegation/i] },
  { concept: "non-goals", patterns: [/does\s+NOT\s+do/i, /non-?goals?/i] },
  { concept: "escalation", patterns: [/##\s+escalation/i] },
];

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

describe("onboarding assets structure", () => {
  it.each(DEFAULT_ROLE_DIRS)("%s directory exists", async (role) => {
    const dir = path.join(ASSETS_DIR, role);
    const stat = await fs.stat(dir);
    expect(stat.isDirectory()).toBe(true);
  });

  it.each(
    DEFAULT_ROLE_DIRS.flatMap((role) =>
      REQUIRED_FILES.map((file) => [role, file] as const),
    ),
  )("%s/%s exists and is non-empty", async (role, file) => {
    const contents = await readIfExists(path.join(ASSETS_DIR, role, file));
    expect(contents, `${role}/${file} is missing`).not.toBeNull();
    expect(contents!.trim().length, `${role}/${file} is empty`).toBeGreaterThan(
      0,
    );
  });

  it.each(DEFAULT_ROLE_DIRS.filter((role) => role !== "_template"))(
    "%s/AGENTS.md covers required sections",
    async (role) => {
      const agentsMd = await readIfExists(
        path.join(ASSETS_DIR, role, "AGENTS.md"),
      );
      expect(agentsMd).not.toBeNull();
      for (const { concept, patterns } of REQUIRED_AGENTS_MD_SECTIONS) {
        const matched = patterns.some((p) => p.test(agentsMd!));
        expect(
          matched,
          `${role}/AGENTS.md is missing a section covering "${concept}"`,
        ).toBe(true);
      }
    },
  );

  it.each(DEFAULT_ROLE_DIRS.filter((role) => role !== "_template"))(
    "%s/AGENTS.md has a TL;DR italic opener",
    async (role) => {
      const agentsMd = await readIfExists(
        path.join(ASSETS_DIR, role, "AGENTS.md"),
      );
      expect(agentsMd).not.toBeNull();
      // First non-empty line or block should be an italicised TL;DR starting
      // with "_You are" — the convention established by the template.
      const firstBlock = agentsMd!.trim().split(/\n\s*\n/)[0] ?? "";
      expect(
        /^_You are\b/i.test(firstBlock),
        `${role}/AGENTS.md should open with an italic "_You are ..." TL;DR block`,
      ).toBe(true);
    },
  );
});
