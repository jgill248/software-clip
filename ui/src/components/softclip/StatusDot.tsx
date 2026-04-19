import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type StatusDotState =
  | "running"
  | "idle"
  | "blocked"
  | "offline"
  | "pass"
  | "fail";

interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  state: StatusDotState;
}

export function StatusDot({ state, className, ...rest }: StatusDotProps) {
  return (
    <span
      className={cn("sc-status-dot", state, className)}
      aria-label={state}
      {...rest}
    />
  );
}
