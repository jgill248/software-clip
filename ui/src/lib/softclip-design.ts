import type { Agent, Issue } from "@softclipai/shared";
import type { ChipVariant } from "@/components/softclip/Chip";
import type { StatusDotState } from "@/components/softclip/StatusDot";

/**
 * Map a review/approval kind to a chip color variant.
 * Kinds the design calls out: code (blue), architecture (purple), design (amber).
 */
export function chipVariantForReviewKind(kind: string | null | undefined): ChipVariant {
  const k = (kind ?? "").toLowerCase();
  if (k.includes("code")) return "blue";
  if (k.includes("arch")) return "purple";
  if (k.includes("design")) return "amber";
  if (k.includes("qa") || k.includes("test")) return "green";
  return "default";
}

/**
 * Map the live Agent.status → the prototype's StatusDot state.
 */
export function statusStateFromAgent(agent: Pick<Agent, "status">): StatusDotState {
  switch (agent.status) {
    case "running":
      return "running";
    case "active":
    case "idle":
      return "idle";
    case "paused":
    case "pending_approval":
      return "blocked";
    case "error":
      return "fail";
    case "terminated":
      return "offline";
    default:
      return "idle";
  }
}

/**
 * An issue is blocked if its status is explicitly "blocked" or it has a
 * blocks-relation label that marks it waiting. The design calls this out
 * with an amber chip; callers generally filter to `status === "blocked"`
 * for the "Blocked issues" dashboard card.
 */
export function isIssueBlocked(issue: Pick<Issue, "status">): boolean {
  return issue.status === "blocked";
}

/**
 * Two-letter initials for a company or product, matching the design's rail.
 */
export function productInitials(name: string, prefix?: string | null): string {
  if (prefix && prefix.length >= 2) return prefix.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Walk an Agent list into the prototype's org tree shape: root + reports.
 * Prefers `reportsTo` linkage; falls back to role hierarchy if none of the
 * agents declare a reports-to edge.
 */
export interface OrgNode {
  agent: Agent;
  reports: OrgNode[];
}

export function orgTreeFromAgents(agents: Agent[]): OrgNode | null {
  if (!agents.length) return null;
  const byId = new Map(agents.map((a) => [a.id, a] as const));
  const hasReportsTo = agents.some((a) => a.reportsTo && byId.has(a.reportsTo));

  if (hasReportsTo) {
    const children = new Map<string | null, Agent[]>();
    for (const a of agents) {
      const parent = a.reportsTo && byId.has(a.reportsTo) ? a.reportsTo : null;
      const bucket = children.get(parent) ?? [];
      bucket.push(a);
      children.set(parent, bucket);
    }
    const roots = children.get(null) ?? [];
    const root = pickRoot(roots) ?? pickRoot(agents);
    if (!root) return null;

    const build = (agent: Agent, seen: Set<string>): OrgNode => {
      if (seen.has(agent.id)) return { agent, reports: [] };
      seen.add(agent.id);
      const reports = (children.get(agent.id) ?? []).map((r) => build(r, seen));
      return { agent, reports };
    };
    return build(root, new Set());
  }

  const root = pickRoot(agents);
  if (!root) return null;
  const reports = agents
    .filter((a) => a.id !== root.id)
    .map<OrgNode>((a) => ({ agent: a, reports: [] }));
  return { agent: root, reports };
}

const ROLE_RANK: Record<string, number> = {
  ceo: 0,
  cto: 1,
  pm: 2,
  cmo: 3,
  cfo: 3,
  engineer: 4,
  designer: 4,
  qa: 5,
  devops: 5,
  security: 5,
  researcher: 5,
  general: 6,
};

function pickRoot(agents: Agent[]): Agent | null {
  if (!agents.length) return null;
  const sorted = [...agents].sort((a, b) => {
    const ra = ROLE_RANK[a.role] ?? 99;
    const rb = ROLE_RANK[b.role] ?? 99;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
  return sorted[0];
}
