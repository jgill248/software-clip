import { X } from "lucide-react";
import { usePanel } from "../context/PanelContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PropertiesPanel() {
  const { panelContent, panelVisible, setPanelVisible } = usePanel();

  if (!panelContent) return null;

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-in-out h-full border-l"
      style={{
        width: panelVisible ? 280 : 0,
        opacity: panelVisible ? 1 : 0,
        background: "var(--panel)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex-1 flex flex-col min-w-[280px] min-h-0">
        <div
          className="flex items-center justify-between px-3 h-11 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <span className="t-meta upper fg-muted">Properties</span>
          <Button variant="ghost" size="icon-xs" onClick={() => setPanelVisible(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3">{panelContent}</div>
        </ScrollArea>
      </div>
    </aside>
  );
}
