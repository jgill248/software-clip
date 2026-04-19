interface HealthBarProps {
  done: number;
  committed: number;
  label?: string;
}

export function HealthBar({ done, committed, label = "Committed vs done" }: HealthBarProps) {
  const total = Math.max(committed, 1);
  const pct = Math.round((done / total) * 100);
  return (
    <div>
      <div className="sc-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <span className="t-meta fg-muted upper">{label}</span>
        <span className="t-meta fg num">
          <span className="fg">{done}</span>
          <span className="fg-faint"> / {committed}</span> · {pct}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--panel-2)",
          borderRadius: 999,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: "var(--accent-blue)",
          }}
        />
      </div>
    </div>
  );
}
