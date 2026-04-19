import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KbdProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Kbd({ className, children, ...rest }: KbdProps) {
  return (
    <span className={cn("sc-kbd", className)} {...rest}>
      {children}
    </span>
  );
}
