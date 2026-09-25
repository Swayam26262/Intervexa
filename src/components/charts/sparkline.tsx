/**
 * Stat-tile sparkline: the history in a de-emphasised hue, the latest point in the accent.
 * Decorative (the tile's value carries the number); hidden from assistive tech.
 */
export function Sparkline({ values, max = 100, width = 120, height = 36 }: { values: number[]; max?: number; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 4 - (Math.min(v, max) / max) * (height - 8)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`-4 0 ${width + 8} ${height}`} width={width} height={height} aria-hidden className="overflow-visible">
      <path d={d} fill="none" className="stroke-outline" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={4} className="fill-primary stroke-card" strokeWidth={2} />
    </svg>
  );
}
