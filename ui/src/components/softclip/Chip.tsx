import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipVariant = "default" | "blue" | "green" | "amber" | "red" | "purple";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  square?: boolean;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Chip({
  variant = "default",
  square,
  dot,
  icon,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={cn(
        "sc-chip",
        variant !== "default" && `variant-${variant}`,
        square && "square",
        className,
      )}
      {...rest}
    >
      {dot && <span className="dot" />}
      {icon}
      {children}
    </span>
  );
}
