import type { ReactNode } from "react";
import type { Issue } from "@softclipai/shared";
import { PriorityBars } from "./PriorityBars";
import { StatusIcon } from "./StatusIcon";
import { Chip } from "./Chip";
import { AgentAvatar } from "./AgentAvatar";
import { ListRow } from "./ListRow";
import { cn } from "@/lib/utils";

interface IssueRowProps {
  issue: Issue;
  assigneeRole?: string | null;
  assigneeName?: string | null;
  onOpen?: (id: string) => void;
  dense?: boolean;
  trailing?: ReactNode;
  stretch?: boolean;
  className?: string;
}

export function IssueRow({
  issue,
  assigneeRole,
  assigneeName,
  onOpen,
  dense,
  trailing,
  stretch,
  className,
}: IssueRowProps) {
  const blocked = issue.status === "blocked";
  const identifier = issue.identifier ?? issue.id.slice(0, 8);
  return (
    <ListRow dense={dense} className={className} onClick={() => onOpen?.(issue.id)}>
      <PriorityBars priority={issue.priority} />
      <StatusIcon status={issue.status} />
      <span className="sc-issue-id t-mono">{identifier}</span>
      <span className="sc-stretch sc-truncate">{issue.title}</span>
      {blocked && (
        <Chip variant="amber" square>
          Blocked
        </Chip>
      )}
      {stretch && (
        <span
          className={cn("sc-chip square")}
          style={{ borderStyle: "dashed", background: "transparent" }}
        >
          Stretch
        </span>
      )}
      {trailing}
      {assigneeRole && <AgentAvatar role={assigneeRole} size={18} title={assigneeName ?? undefined} />}
    </ListRow>
  );
}
