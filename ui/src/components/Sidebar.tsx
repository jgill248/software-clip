import {
  Inbox,
  CircleDot,
  Target,
  LayoutDashboard,
  History,
  Search,
  SquarePen,
  Network,
  Boxes,
  Repeat,
  Settings,
  CalendarRange,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SidebarSection } from "./SidebarSection";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarProjects } from "./SidebarProjects";
import { SidebarAgents } from "./SidebarAgents";
import { useDialog } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { heartbeatsApi } from "../api/heartbeats";
import { queryKeys } from "../lib/queryKeys";
import { useInboxBadge } from "../hooks/useInboxBadge";
import { PluginSlotOutlet } from "@/plugins/slots";
import { SidebarCompanyMenu } from "./SidebarCompanyMenu";
import { Kbd } from "@/components/softclip/Kbd";

export function Sidebar() {
  const { openNewIssue } = useDialog();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const inboxBadge = useInboxBadge(selectedCompanyId);
  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 10_000,
  });
  const liveRunCount = liveRuns?.length ?? 0;

  function openSearch() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }

  const pluginContext = {
    productId: selectedCompanyId,
    companyPrefix: selectedCompany?.issuePrefix ?? null,
  };

  return (
    <aside
      className="w-60 h-full min-h-0 border-r flex flex-col"
      style={{
        background: "var(--bg)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Product header: company menu (opens palette-style dropdown) */}
      <div
        className="flex items-center gap-1 px-2 h-11 shrink-0 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <SidebarCompanyMenu />
      </div>

      {/* Search / jump pill — clicks into command palette */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <button
          type="button"
          onClick={openSearch}
          className="flex items-center gap-2 h-7 w-full px-2 rounded-[5px] border text-xs transition-colors"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            color: "var(--fg-muted)",
          }}
          aria-label="Search or jump to"
        >
          <Search className="h-3 w-3" />
          <span className="flex-1 truncate text-left">Search or jump to…</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide flex flex-col gap-4 px-3 py-2">
        <div className="flex flex-col gap-0.5">
          {/* New Issue button aligned with nav items */}
          <button
            onClick={() => openNewIssue()}
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors rounded-[5px]"
          >
            <SquarePen className="h-4 w-4 shrink-0" />
            <span className="truncate">New Issue</span>
            <span className="ml-auto"><Kbd>C</Kbd></span>
          </button>
          <SidebarNavItem to="/dashboard" label="Dashboard" icon={LayoutDashboard} liveCount={liveRunCount} />
          <SidebarNavItem
            to="/inbox"
            label="Inbox"
            icon={Inbox}
            badge={inboxBadge.inbox}
            badgeTone={inboxBadge.failedRuns > 0 ? "danger" : "default"}
            alert={inboxBadge.failedRuns > 0}
          />
          <PluginSlotOutlet
            slotTypes={["sidebar"]}
            context={pluginContext}
            className="flex flex-col gap-0.5"
            itemClassName="text-[13px] font-medium"
            missingBehavior="placeholder"
          />
        </div>

        <SidebarSection label="Work">
          <SidebarNavItem to="/issues" label="Issues" icon={CircleDot} />
          <SidebarNavItem to="/sprints" label="Sprints" icon={CalendarRange} />
          <SidebarNavItem to="/ceremonies" label="Ceremonies" icon={Repeat} />
          <SidebarNavItem to="/roadmap" label="Roadmap" icon={Target} />
        </SidebarSection>

        <SidebarProjects />

        <SidebarAgents />

        <SidebarSection label="Product">
          <SidebarNavItem to="/org" label="Org" icon={Network} />
          <SidebarNavItem to="/skills" label="Skills" icon={Boxes} />
          {/* Softclip pivot §6: Costs nav link + /costs page removed.
              Cost telemetry is still recorded on the backend for
              observability but is no longer surfaced in the UI. */}
          <SidebarNavItem to="/activity" label="Activity" icon={History} />
          <SidebarNavItem to="/company/settings" label="Settings" icon={Settings} />
        </SidebarSection>

        <PluginSlotOutlet
          slotTypes={["sidebarPanel"]}
          context={pluginContext}
          className="flex flex-col gap-3"
          itemClassName="rounded-lg border border-border p-3"
          missingBehavior="placeholder"
        />
      </nav>
    </aside>
  );
}
