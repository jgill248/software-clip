import { NavLink } from "@/lib/router";
import { SIDEBAR_SCROLL_RESET_STATE } from "../lib/navigation-scroll";
import { cn } from "../lib/utils";
import { useSidebar } from "../context/SidebarContext";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  className?: string;
  badge?: number;
  badgeTone?: "default" | "danger";
  textBadge?: string;
  textBadgeTone?: "default" | "amber";
  alert?: boolean;
  liveCount?: number;
}

export function SidebarNavItem({
  to,
  label,
  icon: Icon,
  end,
  className,
  badge,
  badgeTone = "default",
  textBadge,
  textBadgeTone = "default",
  alert = false,
  liveCount,
}: SidebarNavItemProps) {
  const { isMobile, setSidebarOpen } = useSidebar();

  return (
    <NavLink
      to={to}
      state={SIDEBAR_SCROLL_RESET_STATE}
      end={end}
      onClick={() => {
        if (isMobile) setSidebarOpen(false);
      }}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium rounded-[5px] transition-colors",
          isActive
            ? "bg-[color:var(--selected)] text-foreground before:absolute before:left-0 before:top-[6px] before:bottom-[6px] before:w-0.5 before:rounded before:bg-foreground"
            : "text-foreground/80 hover:bg-[color:var(--hover)] hover:text-foreground",
          className,
        )
      }
    >
      <span className="relative shrink-0">
        <Icon className="h-4 w-4" />
        {alert && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
            style={{
              background: "var(--accent-red)",
              boxShadow: "0 0 0 2px var(--bg)",
            }}
          />
        )}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {textBadge && (
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
            textBadgeTone === "amber"
              ? "text-[color:var(--accent-amber)] bg-[color:var(--accent-amber-wash)]"
              : "bg-muted text-muted-foreground",
          )}
        >
          {textBadge}
        </span>
      )}
      {liveCount != null && liveCount > 0 && (
        <span className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-pulse absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "var(--accent-blue)" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "var(--accent-blue)" }}
            />
          </span>
          <span
            className="text-[11px] font-medium"
            style={{ color: "var(--accent-blue)" }}
          >
            {liveCount} live
          </span>
        </span>
      )}
      {badge != null && badge > 0 && (
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-xs leading-none",
            badgeTone === "danger"
              ? "text-[color:var(--accent-red)] bg-[color:var(--accent-red-wash)]"
              : "bg-primary text-primary-foreground",
          )}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}
