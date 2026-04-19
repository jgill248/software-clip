import type { IssuePriority } from "@softclipai/shared";
import { cn } from "@/lib/utils";

const PRIORITY_LEVEL: Record<IssuePriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const PRIORITY_CLASS: Record<IssuePriority, string> = {
  critical: "priority-p0",
  high: "priority-p1",
  medium: "priority-p2",
  low: "priority-p3",
};

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  critical: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
};

interface PriorityBarsProps {
  priority: IssuePriority;
  size?: number;
  className?: string;
}

export function PriorityBars({ priority, size = 14, className }: PriorityBarsProps) {
  const filled = PRIORITY_LEVEL[priority] ?? 0;
  return (
    <span
      className={cn(PRIORITY_CLASS[priority], className)}
      title={PRIORITY_LABEL[priority]}
      aria-label={`Priority ${PRIORITY_LABEL[priority]}`}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 1,
        height: size,
        width: size,
      }}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: Math.floor(size / 4),
            height: (size / 3) * i,
            background:
              i <= filled
                ? "currentColor"
                : "color-mix(in oklch, currentColor 25%, transparent)",
            borderRadius: 1,
          }}
        />
      ))}
    </span>
  );
}

export { PRIORITY_LABEL };
