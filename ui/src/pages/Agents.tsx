import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { agentsApi, type OrgNode } from "../api/agents";
import { heartbeatsApi } from "../api/heartbeats";
import { useCompany } from "../context/CompanyContext";
import { useDialog } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useSidebar } from "../context/SidebarContext";
import { queryKeys } from "../lib/queryKeys";
import { StatusBadge } from "../components/StatusBadge";
import { agentStatusDot, agentStatusDotDefault } from "../lib/status-colors";
import { EntityRow } from "../components/EntityRow";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { relativeTime, cn, agentRouteRef, agentUrl } from "../lib/utils";
import { PageTabBar } from "../components/PageTabBar";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bot, Minus, Pause, Play, Plus, List, GitBranch, SlidersHorizontal } from "lucide-react";
import { AGENT_ROLE_LABELS, type Agent } from "@softclipai/shared";
import { AgentAvatar } from "@/components/softclip/AgentAvatar";
import { StatusDot } from "@/components/softclip/StatusDot";
import { Chip } from "@/components/softclip/Chip";
import { statusStateFromAgent } from "@/lib/softclip-design";

import { getAdapterLabel } from "../adapters/adapter-display-registry";

const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;

type FilterTab = "all" | "active" | "paused" | "error";

function matchesFilter(status: string, tab: FilterTab, showTerminated: boolean): boolean {
  if (status === "terminated") return showTerminated;
  if (tab === "all") return true;
  if (tab === "active") return status === "active" || status === "running" || status === "idle";
  if (tab === "paused") return status === "paused";
  if (tab === "error") return status === "error";
  return true;
}

function filterAgents(agents: Agent[], tab: FilterTab, showTerminated: boolean): Agent[] {
  return agents
    .filter((a) => matchesFilter(a.status, tab, showTerminated))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function filterOrgTree(nodes: OrgNode[], tab: FilterTab, showTerminated: boolean): OrgNode[] {
  return nodes
    .reduce<OrgNode[]>((acc, node) => {
      const filteredReports = filterOrgTree(node.reports, tab, showTerminated);
      if (matchesFilter(node.status, tab, showTerminated) || filteredReports.length > 0) {
        acc.push({ ...node, reports: filteredReports });
      }
      return acc;
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function Agents() {
  const { selectedCompanyId } = useCompany();
  const { openNewAgent } = useDialog();
  const { setBreadcrumbs } = useBreadcrumbs();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useSidebar();
  const pathSegment = location.pathname.split("/").pop() ?? "all";
  const tab: FilterTab = (pathSegment === "all" || pathSegment === "active" || pathSegment === "paused" || pathSegment === "error") ? pathSegment : "all";
  const [view, setView] = useState<"list" | "org">("org");
  const forceListView = isMobile;
  const effectiveView: "list" | "org" = forceListView ? "list" : view;
  const [showTerminated, setShowTerminated] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: agents, isLoading, error } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: orgTree } = useQuery({
    queryKey: queryKeys.org(selectedCompanyId!),
    queryFn: () => agentsApi.org(selectedCompanyId!),
    enabled: !!selectedCompanyId && effectiveView === "org",
  });

  const { data: runs } = useQuery({
    queryKey: [...queryKeys.liveRuns(selectedCompanyId!), "agents-page"],
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 15_000,
  });

  // Map agentId -> first live run + live run count
  const liveRunByAgent = useMemo(() => {
    const map = new Map<string, { runId: string; liveCount: number }>();
    for (const r of runs ?? []) {
      if (r.status !== "running" && r.status !== "queued") continue;
      const existing = map.get(r.agentId);
      if (existing) {
        existing.liveCount += 1;
        continue;
      }
      map.set(r.agentId, { runId: r.id, liveCount: 1 });
    }
    return map;
  }, [runs]);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents ?? []) map.set(a.id, a);
    return map;
  }, [agents]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Agents" }]);
  }, [setBreadcrumbs]);

  if (!selectedCompanyId) {
    return <EmptyState icon={Bot} message="Select a company to view agents." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  const filtered = filterAgents(agents ?? [], tab, showTerminated);
  const filteredOrg = filterOrgTree(orgTree ?? [], tab, showTerminated);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => navigate(`/agents/${v}`)}>
          <PageTabBar
            items={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "error", label: "Error" },
            ]}
            value={tab}
            onValueChange={(v) => navigate(`/agents/${v}`)}
          />
        </Tabs>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="relative">
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 text-xs transition-colors border border-border",
                filtersOpen || showTerminated ? "text-foreground bg-accent" : "text-muted-foreground hover:bg-accent/50"
              )}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filters
              {showTerminated && <span className="ml-0.5 px-1 bg-foreground/10 rounded text-[10px]">1</span>}
            </button>
            {filtersOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 border border-border bg-popover shadow-md p-1">
                <button
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-left hover:bg-accent/50 transition-colors"
                  onClick={() => setShowTerminated(!showTerminated)}
                >
                  <span className={cn(
                    "flex items-center justify-center h-3.5 w-3.5 border border-border rounded-sm",
                    showTerminated && "bg-foreground"
                  )}>
                    {showTerminated && <span className="text-background text-[10px] leading-none">&#10003;</span>}
                  </span>
                  Show terminated
                </button>
              </div>
            )}
          </div>
          {/* View toggle */}
          {!forceListView && (
            <div className="flex items-center border border-border">
              <button
                className={cn(
                  "p-1.5 transition-colors",
                  effectiveView === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                )}
                onClick={() => setView("list")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                className={cn(
                  "p-1.5 transition-colors",
                  effectiveView === "org" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                )}
                onClick={() => setView("org")}
              >
                <GitBranch className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={openNewAgent}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Agent
          </Button>
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">{filtered.length} agent{filtered.length !== 1 ? "s" : ""}</p>
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {agents && agents.length === 0 && (
        <EmptyState
          icon={Bot}
          message="Create your first agent to get started."
          action="New Agent"
          onAction={openNewAgent}
        />
      )}

      {/* List view */}
      {effectiveView === "list" && filtered.length > 0 && (
        <div className="border border-border">
          {filtered.map((agent) => {
            return (
              <EntityRow
                key={agent.id}
                title={agent.name}
                subtitle={`${roleLabels[agent.role] ?? agent.role}${agent.title ? ` - ${agent.title}` : ""}`}
                to={agentUrl(agent)}
                className={agent.pausedAt && tab !== "paused" ? "opacity-50" : ""}
                leading={
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full ${agentStatusDot[agent.status] ?? agentStatusDotDefault}`}
                    />
                  </span>
                }
                trailing={
                  <div className="flex items-center gap-3">
                    <span className="sm:hidden">
                      {liveRunByAgent.has(agent.id) ? (
                        <LiveRunIndicator
                          agentRef={agentRouteRef(agent)}
                          runId={liveRunByAgent.get(agent.id)!.runId}
                          liveCount={liveRunByAgent.get(agent.id)!.liveCount}
                        />
                      ) : (
                        <StatusBadge status={agent.status} />
                      )}
                    </span>
                    <div className="hidden sm:flex items-center gap-3">
                      {liveRunByAgent.has(agent.id) && (
                        <LiveRunIndicator
                          agentRef={agentRouteRef(agent)}
                          runId={liveRunByAgent.get(agent.id)!.runId}
                          liveCount={liveRunByAgent.get(agent.id)!.liveCount}
                        />
                      )}
                      <span className="text-xs text-muted-foreground font-mono w-14 text-right">
                        {getAdapterLabel(agent.adapterType)}
                      </span>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {agent.lastHeartbeatAt ? relativeTime(agent.lastHeartbeatAt) : "—"}
                      </span>
                      <span className="w-20 flex justify-end">
                        <StatusBadge status={agent.status} />
                      </span>
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {effectiveView === "list" && agents && agents.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No agents match the selected filter.
        </p>
      )}

      {/* Org chart view */}
      {effectiveView === "org" && filteredOrg.length > 0 && (
        <div className="py-2">
          {filteredOrg.map((root) => (
            <OrgChartBranch
              key={root.id}
              root={root}
              agentMap={agentMap}
              liveRunByAgent={liveRunByAgent}
              tab={tab}
            />
          ))}
        </div>
      )}

      {effectiveView === "org" && orgTree && orgTree.length > 0 && filteredOrg.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No agents match the selected filter.
        </p>
      )}

      {effectiveView === "org" && orgTree && orgTree.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No organizational hierarchy defined.
        </p>
      )}
    </div>
  );
}

const PER_ROW = 6;
const CARD_WIDTH = 220;
const CARD_GAP = 16;

function OrgChartBranch({
  root,
  agentMap,
  liveRunByAgent,
  tab,
}: {
  root: OrgNode;
  agentMap: Map<string, Agent>;
  liveRunByAgent: Map<string, { runId: string; liveCount: number }>;
  tab: FilterTab;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hovered = hoverId
    ? (agentMap.get(hoverId) ??
        findInTree(root, hoverId))
    : null;
  const hoveredNode = hoverId ? findNode(root, hoverId) : null;

  // Flatten reports into rows of PER_ROW.
  const reports = root.reports ?? [];
  const rows: OrgNode[][] = [];
  for (let i = 0; i < reports.length; i += PER_ROW) {
    rows.push(reports.slice(i, i + PER_ROW));
  }

  return (
    <div className="relative flex flex-col items-center gap-0 px-4 py-4">
      {/* Root */}
      <OrgAgentCard
        node={root}
        agent={agentMap.get(root.id)}
        liveRun={liveRunByAgent.get(root.id) ?? null}
        tab={tab}
        onHover={setHoverId}
      />

      {rows.map((row, ri) => {
        const n = row.length;
        const rowMax = Math.min(n, PER_ROW) * (CARD_WIDTH + CARD_GAP);
        return (
          <div key={ri} className="w-full flex flex-col items-center">
            {/* Connectors */}
            <div
              className="w-full flex justify-center"
              style={{ maxWidth: rowMax }}
            >
              <svg width="100%" height="40" style={{ display: "block" }}>
                <line
                  x1="50%"
                  y1="0"
                  x2="50%"
                  y2="16"
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                {n > 1 && (
                  <line
                    x1={`${100 / n / 2}%`}
                    y1="16"
                    x2={`${100 - 100 / n / 2}%`}
                    y2="16"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                )}
                {row.map((_, i) => {
                  const x = n === 1 ? "50%" : `${(100 / n) * (i + 0.5)}%`;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1="16"
                      x2={x}
                      y2="40"
                      stroke="var(--border)"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
            </div>

            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
                gap: CARD_GAP,
                maxWidth: rowMax,
                marginBottom: ri < rows.length - 1 ? 8 : 0,
              }}
            >
              {row.map((child) => (
                <div
                  key={child.id}
                  className="flex justify-center"
                >
                  <OrgAgentCard
                    node={child}
                    agent={agentMap.get(child.id)}
                    liveRun={liveRunByAgent.get(child.id) ?? null}
                    tab={tab}
                    onHover={setHoverId}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Hover reveal popover */}
      {hovered && hoveredNode && (
        <div
          className="fixed"
          style={{
            right: 24,
            bottom: 24,
            width: 340,
            background: "var(--elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 14,
            boxShadow: "var(--shadow-lg)",
            zIndex: 20,
          }}
        >
          <div className="flex items-center gap-2.5 mb-2.5">
            <AgentAvatar role={hoveredNode.role} size={32} />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="fg truncate" style={{ fontWeight: 500 }}>
                {hoveredNode.name}
              </div>
              <div className="fg-faint t-meta">
                {roleLabels[hoveredNode.role] ?? hoveredNode.role}
              </div>
            </div>
            <AgentStateChip status={hoveredNode.status} />
          </div>
          <div className="t-meta fg-muted upper mb-1">Last heartbeat</div>
          <div className="t-body fg-2 mb-2.5">
            {hovered.lastHeartbeatAt
              ? relativeTime(hovered.lastHeartbeatAt)
              : "—"}
          </div>
          <div className="t-meta fg-muted upper mb-1.5">Adapter</div>
          <div className="t-body fg-2">{getAdapterLabel(hovered.adapterType)}</div>
        </div>
      )}
    </div>
  );
}

function findNode(root: OrgNode, id: string): OrgNode | null {
  if (root.id === id) return root;
  for (const r of root.reports ?? []) {
    const found = findNode(r, id);
    if (found) return found;
  }
  return null;
}

function findInTree(root: OrgNode, id: string): Agent | null {
  const node = findNode(root, id);
  if (!node) return null;
  // Return a minimal Agent-shaped object for hover popover fallback
  return {
    id: node.id,
    name: node.name,
    role: node.role,
    status: node.status,
    adapterType: "process",
    lastHeartbeatAt: null,
  } as unknown as Agent;
}

function AgentStateChip({ status }: { status: string }) {
  if (status === "running")
    return (
      <Chip variant="blue" icon={<Play size={10} />}>
        Running
      </Chip>
    );
  if (status === "blocked" || status === "paused" || status === "pending_approval")
    return (
      <Chip variant="amber" icon={<AlertTriangle size={10} />}>
        Blocked
      </Chip>
    );
  if (status === "error" || status === "failed")
    return (
      <Chip variant="red" icon={<AlertTriangle size={10} />}>
        Error
      </Chip>
    );
  if (status === "offline" || status === "terminated")
    return (
      <Chip icon={<Minus size={10} />}>
        Offline
      </Chip>
    );
  return (
    <Chip icon={<Pause size={10} />}>
      Idle
    </Chip>
  );
}

function OrgAgentCard({
  node,
  agent,
  liveRun,
  tab,
  onHover,
}: {
  node: OrgNode;
  agent: Agent | undefined;
  liveRun: { runId: string; liveCount: number } | null;
  tab: FilterTab;
  onHover: (id: string | null) => void;
}) {
  const dotState = statusStateFromAgent(
    agent ?? ({ status: node.status } as Agent),
  );
  const dimmed = agent?.pausedAt && tab !== "paused";
  return (
    <Link
      to={agent ? agentUrl(agent) : `/agents/${node.id}`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "block no-underline text-inherit rounded-[8px] border transition-[transform,border-color] hover:border-[color:var(--border-strong)]",
        dimmed && "opacity-65",
      )}
      style={{
        width: CARD_WIDTH,
        background: "var(--panel)",
        borderColor: "var(--border)",
        padding: 12,
        opacity: node.status === "terminated" ? 0.65 : undefined,
      }}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <AgentAvatar role={node.role} size={32} />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="fg truncate" style={{ fontWeight: 500 }}>
            {node.name}
          </div>
          <div className="fg-faint t-meta">
            {roleLabels[node.role] ?? node.role}
          </div>
        </div>
        <StatusDot state={dotState} />
      </div>
      <div className="t-meta fg-muted upper mb-1">Current</div>
      <div
        className="t-meta fg-2"
        style={{ minHeight: 16, lineHeight: 1.4 }}
      >
        {liveRun
          ? `Live run · ${liveRun.liveCount} active`
          : agent?.title ?? "—"}
      </div>
      <div
        className="sc-hr"
        style={{ margin: "10px 0" }}
      />
      <div className="flex items-center justify-between">
        <AgentStateChip status={node.status} />
        <span className="fg-faint t-meta">
          {agent?.lastHeartbeatAt ? relativeTime(agent.lastHeartbeatAt) : "—"}
        </span>
      </div>
    </Link>
  );
}

function LiveRunIndicator({
  agentRef,
  runId,
  liveCount,
}: {
  agentRef: string;
  runId: string;
  liveCount: number;
}) {
  return (
    <Link
      to={`/agents/${agentRef}/runs/${runId}`}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
      </span>
      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
        Live{liveCount > 1 ? ` (${liveCount})` : ""}
      </span>
    </Link>
  );
}
