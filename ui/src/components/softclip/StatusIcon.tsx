import type { IssueStatus } from "@softclipai/shared";
import {
  Circle,
  CircleDashed,
  CircleCheck,
  AlertTriangle,
  CircleDot,
  CircleSlash,
} from "lucide-react";

interface StatusIconProps {
  status: IssueStatus | string;
  size?: number;
}

export function StatusIcon({ status, size = 14 }: StatusIconProps) {
  switch (status) {
    case "todo":
      return <Circle size={size} className="fg-faint" />;
    case "in_progress":
      return <CircleDot size={size} style={{ color: "var(--accent-blue)" }} />;
    case "in_review":
      return <CircleDashed size={size} style={{ color: "var(--accent-purple)" }} />;
    case "done":
      return <CircleCheck size={size} style={{ color: "var(--accent-green)" }} />;
    case "blocked":
      return <AlertTriangle size={size} style={{ color: "var(--accent-amber)" }} />;
    case "cancelled":
      return <CircleSlash size={size} style={{ color: "var(--fg-muted)" }} />;
    case "backlog":
    default:
      return <Circle size={size} className="fg-faint" />;
  }
}

export const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
  cancelled: "Cancelled",
};
