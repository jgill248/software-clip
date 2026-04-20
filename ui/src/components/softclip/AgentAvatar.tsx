import type { ReactNode } from "react";
import type { AgentRole } from "@softclipai/shared";
import {
  Compass,
  Columns3,
  PenTool,
  Wrench,
  ShieldCheck,
  Cpu,
  Briefcase,
  Target,
  Boxes,
  Database,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<AgentRole, LucideIcon> = {
  // Softclip dev-team roles
  "product-owner": Target,
  "software-architect": Boxes,
  "solution-architect": Boxes,
  "data-architect": Database,
  engineer: Wrench,
  designer: PenTool,
  qa: ShieldCheck,
  devops: Wrench,
  security: ShieldCheck,
  researcher: Columns3,
  general: Cpu,
  // Legacy roles
  ceo: Compass,
  cto: Columns3,
  cmo: Briefcase,
  cfo: Briefcase,
  pm: Compass,
};

export function agentRoleIcon(role: AgentRole | string | null | undefined): LucideIcon {
  if (!role) return Cpu;
  return ROLE_ICONS[role as AgentRole] ?? Cpu;
}

interface AgentAvatarProps {
  role?: AgentRole | string | null;
  size?: number;
  title?: string;
  fallback?: ReactNode;
  className?: string;
}

export function AgentAvatar({
  role,
  size = 20,
  title,
  fallback,
  className,
}: AgentAvatarProps) {
  const Icon = agentRoleIcon(role);
  const iconSize = Math.max(10, Math.floor(size * 0.55));
  return (
    <span
      className={cn("sc-avatar agent", className)}
      style={{ width: size, height: size }}
      title={title}
    >
      {fallback ?? <Icon size={iconSize} />}
    </span>
  );
}
