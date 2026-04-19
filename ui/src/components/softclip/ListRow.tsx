import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  dense?: boolean;
}

export function ListRow({ dense, className, style, ...rest }: ListRowProps) {
  const denseStyle = dense ? { minHeight: 32, padding: "6px 12px", ...style } : style;
  return <div className={cn("sc-list-row", className)} style={denseStyle} {...rest} />;
}
