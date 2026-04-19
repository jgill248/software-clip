import fs from "node:fs/promises";

/**
 * The five-file bundle that every Softclip default role ships with. Humans
 * edit these under `server/src/onboarding-assets/<role>/`; the loader copies
 * them into a new agent's personal directory when it is hired.
 *
 * `README.md` is a human-facing map of the bundle and is intentionally not
 * loaded at agent runtime — it's for the person maintaining the bundle.
 */
const FULL_BUNDLE = ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"];

const DEFAULT_AGENT_BUNDLE_FILES: Record<string, readonly string[]> = {
  default: ["AGENTS.md"],
  // Legacy Paperclip CEO bundle — retained so existing installations keep
  // booting. Will be removed once the Softclip rename lands.
  ceo: FULL_BUNDLE,
  "product-owner": FULL_BUNDLE,
  "software-architect": FULL_BUNDLE,
  "solution-architect": FULL_BUNDLE,
  "data-architect": FULL_BUNDLE,
  designer: FULL_BUNDLE,
  engineer: FULL_BUNDLE,
  qa: FULL_BUNDLE,
  security: FULL_BUNDLE,
  devops: FULL_BUNDLE,
};

export type DefaultAgentBundleRole =
  | "default"
  | "ceo"
  | "product-owner"
  | "software-architect"
  | "solution-architect"
  | "data-architect"
  | "designer"
  | "engineer"
  | "qa"
  | "security"
  | "devops";

/**
 * Maps free-form agent `role` strings to a bundle folder. New default roles
 * are added here; anything not recognised falls back to `default` so hires
 * with custom role names still get a minimal AGENTS.md.
 */
const ROLE_STRING_ALIASES: Record<string, DefaultAgentBundleRole> = {
  ceo: "ceo",
  "product-owner": "product-owner",
  product_owner: "product-owner",
  productowner: "product-owner",
  po: "product-owner",
  "software-architect": "software-architect",
  software_architect: "software-architect",
  softwarearchitect: "software-architect",
  "solution-architect": "solution-architect",
  solution_architect: "solution-architect",
  solutionarchitect: "solution-architect",
  "data-architect": "data-architect",
  data_architect: "data-architect",
  dataarchitect: "data-architect",
  architect: "software-architect",
  designer: "designer",
  "ux-designer": "designer",
  ux_designer: "designer",
  uxdesigner: "designer",
  engineer: "engineer",
  developer: "engineer",
  dev: "engineer",
  swe: "engineer",
  qa: "qa",
  tester: "qa",
  quality: "qa",
  security: "security",
  sec: "security",
  "security-engineer": "security",
  security_engineer: "security",
  appsec: "security",
  devops: "devops",
  "dev-ops": "devops",
  sre: "devops",
  ops: "devops",
  "platform-engineer": "devops",
  platform_engineer: "devops",
};

function resolveDefaultAgentBundleUrl(role: DefaultAgentBundleRole, fileName: string) {
  return new URL(`../onboarding-assets/${role}/${fileName}`, import.meta.url);
}

export async function loadDefaultAgentInstructionsBundle(role: DefaultAgentBundleRole): Promise<Record<string, string>> {
  const fileNames = DEFAULT_AGENT_BUNDLE_FILES[role];
  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const content = await fs.readFile(resolveDefaultAgentBundleUrl(role, fileName), "utf8");
      return [fileName, content] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function resolveDefaultAgentInstructionsBundleRole(role: string): DefaultAgentBundleRole {
  const normalized = role.toLowerCase().trim();
  return ROLE_STRING_ALIASES[normalized] ?? "default";
}

export function listDefaultAgentBundleRoles(): readonly DefaultAgentBundleRole[] {
  return Object.keys(DEFAULT_AGENT_BUNDLE_FILES) as DefaultAgentBundleRole[];
}
