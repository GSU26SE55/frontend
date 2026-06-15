interface SparklineProps {
  data: number[];
  h?: number;
  color?: string;
}

export function Sparkline({
  data,
  h = 48,
  color = "var(--ok)",
}: SparklineProps) {
  const w = 300;
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const step = w / (data.length - 1);

  const pts = data.map(
    (v, i) =>
      `${(i * step).toFixed(1)},${(h - ((v - min) / rng) * (h - 6) - 3).toFixed(1)}`,
  );
  const d = `M${pts.join(" L")}`;
  const lastPt = pts[pts.length - 1].split(",");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.08} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />
    </svg>
  );
}
