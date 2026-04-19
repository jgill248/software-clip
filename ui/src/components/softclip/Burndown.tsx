interface BurndownProps {
  actual: number[];
  ideal: number[];
  w?: number;
  h?: number;
}

export function Burndown({ actual, ideal, w = 260, h = 64 }: BurndownProps) {
  if (!actual.length || !ideal.length) return null;
  const max = Math.max(...actual, ...ideal) || 1;
  const pad = 4;
  const steps = Math.max(ideal.length - 1, 1);
  const stepX = (w - pad * 2) / steps;
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const idealPath = ideal
    .map((v, i) => `${i === 0 ? "M" : "L"}${pad + i * stepX},${y(v)}`)
    .join(" ");
  const actualPath = actual
    .map((v, i) => `${i === 0 ? "M" : "L"}${pad + i * stepX},${y(v)}`)
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      style={{ display: "block" }}
      role="img"
      aria-label="Sprint burndown"
    >
      <path
        d={idealPath}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <path d={actualPath} fill="none" stroke="var(--accent-blue)" strokeWidth="1.75" />
      {actual.map((v, i) => (
        <circle
          key={i}
          cx={pad + i * stepX}
          cy={y(v)}
          r="2"
          fill="var(--accent-blue)"
        />
      ))}
    </svg>
  );
}
