import { useCallback, useMemo } from "react";
import { Paperclip, Plus } from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCompany } from "../context/CompanyContext";
import { useDialog } from "../context/DialogContext";
import { cn } from "../lib/utils";
import { queryKeys } from "../lib/queryKeys";
import { sidebarBadgesApi } from "../api/sidebarBadges";
import { heartbeatsApi } from "../api/heartbeats";
import { authApi } from "../api/auth";
import { useCompanyOrder } from "../hooks/useCompanyOrder";
import { useLocation, useNavigate } from "@/lib/router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Company } from "@softclipai/shared";
// Softclip pivot §6: CompanyPatternIcon removed.

function SortableCompanyItem({
  company,
  isSelected,
  hasLiveAgents,
  hasUnreadInbox,
  onSelect,
}: {
  company: Company;
  isSelected: boolean;
  hasLiveAgents: boolean;
  hasUnreadInbox: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const initials = (company.issuePrefix ?? company.name ?? "?")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="overflow-visible">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <a
            href={`/${company.issuePrefix}/dashboard`}
            onClick={(e) => {
              if (isDragging) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              onSelect();
            }}
            className="relative flex items-center justify-center"
          >
            {/* Left-edge active indicator bar, per design */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -left-2 w-0.5 rounded bg-foreground transition-[height] duration-150",
                isSelected ? "h-5" : "h-0",
              )}
            />
            <div
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-[8px] text-[12px] font-semibold tracking-wide transition-colors",
                "border",
                isSelected
                  ? "border-border bg-[color:var(--elevated)] text-foreground"
                  : "border-transparent bg-[color:var(--panel-2)] text-muted-foreground hover:bg-[color:var(--hover)] hover:text-foreground",
                isDragging && "shadow-md",
              )}
              aria-label={company.name}
            >
              {initials}
              {hasLiveAgents && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
                  style={{
                    background: "var(--accent-green)",
                    boxShadow: "0 0 0 2px var(--bg-inset)",
                  }}
                />
              )}
              {!hasLiveAgents && hasUnreadInbox && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
                  style={{
                    background: "var(--accent-blue)",
                    boxShadow: "0 0 0 2px var(--bg-inset)",
                  }}
                />
              )}
            </div>
          </a>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p>{company.name}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function CompanyRail() {
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { openOnboarding } = useDialog();
  const navigate = useNavigate();
  const location = useLocation();
  const isInstanceRoute = location.pathname.startsWith("/instance/");
  const highlightedCompanyId = isInstanceRoute ? null : selectedCompanyId;
  const sidebarCompanies = useMemo(
    () => companies.filter((company) => company.status !== "archived"),
    [companies],
  );
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const productIds = useMemo(() => sidebarCompanies.map((company) => company.id), [sidebarCompanies]);

  const liveRunsQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: queryKeys.liveRuns(productId),
      queryFn: () => heartbeatsApi.liveRunsForCompany(productId),
      refetchInterval: 10_000,
    })),
  });
  const sidebarBadgeQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: queryKeys.sidebarBadges(productId),
      queryFn: () => sidebarBadgesApi.get(productId),
      refetchInterval: 15_000,
    })),
  });
  const hasLiveAgentsByCompanyId = useMemo(() => {
    const result = new Map<string, boolean>();
    productIds.forEach((productId, index) => {
      result.set(productId, (liveRunsQueries[index]?.data?.length ?? 0) > 0);
    });
    return result;
  }, [productIds, liveRunsQueries]);
  const hasUnreadInboxByCompanyId = useMemo(() => {
    const result = new Map<string, boolean>();
    productIds.forEach((productId, index) => {
      result.set(productId, (sidebarBadgeQueries[index]?.data?.inbox ?? 0) > 0);
    });
    return result;
  }, [productIds, sidebarBadgeQueries]);

  const { orderedCompanies, persistOrder } = useCompanyOrder({
    companies: sidebarCompanies,
    userId: currentUserId,
  });

  // Require 8px of movement before starting a drag to avoid interfering with clicks
  const sensors = useSensors(
    // Keep sidebar reordering mouse-only so touch input can scroll/tap without drag affordances.
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const ids = orderedCompanies.map((c) => c.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      persistOrder(arrayMove(ids, oldIndex, newIndex));
    },
    [orderedCompanies, persistOrder]
  );

  return (
    <div
      className="flex flex-col items-center w-14 shrink-0 h-full border-r"
      style={{
        background: "var(--bg-inset)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Softclip brand mark */}
      <div className="flex items-center justify-center h-11 w-full shrink-0">
        <Paperclip className="h-4 w-4 text-foreground" />
      </div>

      {/* Company list */}
      <div className="flex-1 flex flex-col items-center gap-1.5 py-2 w-full overflow-y-auto overflow-x-hidden scrollbar-none">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedCompanies.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedCompanies.map((company) => (
              <SortableCompanyItem
                key={company.id}
                company={company}
                isSelected={company.id === highlightedCompanyId}
                hasLiveAgents={hasLiveAgentsByCompanyId.get(company.id) ?? false}
                hasUnreadInbox={hasUnreadInboxByCompanyId.get(company.id) ?? false}
                onSelect={() => {
                  setSelectedCompanyId(company.id);
                  if (isInstanceRoute) {
                    navigate(`/${company.issuePrefix}/dashboard`);
                  }
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Separator before add button */}
      <div
        className="w-6 h-px mx-auto shrink-0 my-1"
        style={{ background: "var(--border-subtle)" }}
      />

      {/* Add product button */}
      <div className="flex items-center justify-center py-2 shrink-0">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => openOnboarding()}
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-[8px] transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-[color:var(--hover)]",
              )}
              aria-label="Add product"
            >
              <Plus className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p>Add product</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
