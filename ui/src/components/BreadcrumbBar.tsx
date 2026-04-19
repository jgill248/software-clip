import { Link } from "@/lib/router";
import { Menu, Moon, PanelLeft, Sun } from "lucide-react";
import { Fragment, useMemo } from "react";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useSidebar } from "../context/SidebarContext";
import { useCompany } from "../context/CompanyContext";
import { useTheme } from "../context/ThemeContext";
import { PluginSlotOutlet, usePluginSlots } from "@/plugins/slots";
import { PluginLauncherOutlet, usePluginLaunchers } from "@/plugins/launchers";
import { cn } from "../lib/utils";

type GlobalToolbarContext = { productId: string | null; companyPrefix: string | null };

function GlobalToolbarPlugins({ context }: { context: GlobalToolbarContext }) {
  const { slots } = usePluginSlots({ slotTypes: ["globalToolbarButton"], productId: context.productId });
  const { launchers } = usePluginLaunchers({
    placementZones: ["globalToolbarButton"],
    productId: context.productId,
    enabled: !!context.productId,
  });
  if (slots.length === 0 && launchers.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <PluginSlotOutlet
        slotTypes={["globalToolbarButton"]}
        context={context}
        className="flex items-center gap-1"
      />
      <PluginLauncherOutlet
        placementZones={["globalToolbarButton"]}
        context={context}
        className="flex items-center gap-1"
      />
    </div>
  );
}

export function BreadcrumbBar() {
  const { breadcrumbs, mobileToolbar, rightActions } = useBreadcrumbs();
  const { toggleSidebar, isMobile } = useSidebar();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { theme, toggleTheme } = useTheme();

  const globalToolbarSlotContext = useMemo<GlobalToolbarContext>(
    () => ({
      productId: selectedCompanyId ?? null,
      companyPrefix: selectedCompany?.issuePrefix ?? null,
    }),
    [selectedCompanyId, selectedCompany?.issuePrefix],
  );

  if (isMobile && mobileToolbar) {
    return (
      <div
        className="h-11 shrink-0 flex items-center px-2 border-b"
        style={{ background: "var(--bg)", borderColor: "var(--border-subtle)" }}
      >
        {mobileToolbar}
      </div>
    );
  }

  const sidebarToggle = (
    <button
      type="button"
      onClick={toggleSidebar}
      className="sc-btn size-icon variant-ghost"
      aria-label={isMobile ? "Open sidebar" : "Toggle sidebar"}
      title="Toggle sidebar (⌘\\)"
    >
      {isMobile ? <Menu size={14} /> : <PanelLeft size={14} />}
    </button>
  );

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="sc-btn size-icon variant-ghost"
      title="Toggle theme (T)"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );

  return (
    <div
      className={cn(
        "h-11 shrink-0 flex items-center gap-2 px-4 border-b",
      )}
      style={{ background: "var(--bg)", borderColor: "var(--border-subtle)" }}
    >
      {sidebarToggle}
      <div className="flex items-center gap-1.5 text-[13px] min-w-0 overflow-hidden">
        {breadcrumbs.length === 0 ? (
          <span className="text-muted-foreground">Softclip</span>
        ) : (
          breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <span className="fg-faint" aria-hidden>
                    /
                  </span>
                )}
                {isLast || !crumb.href ? (
                  <span
                    className={cn(
                      "truncate",
                      isLast ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </Fragment>
            );
          })
        )}
      </div>
      <div className="flex-1" />
      {rightActions}
      <GlobalToolbarPlugins context={globalToolbarSlotContext} />
      {themeButton}
    </div>
  );
}
