import { cn } from "@/lib/utils";

/**
 * First → latest per row on a shared 0–max scale. First is the de-emphasised gray,
 * latest the accent; a legend is always shown (two series).
 */
export function Dumbbell({
  rows,
  max = 10,
  className,
}: {
  rows: { key: string; label: string; first: number; latest: number; attempts: number }[];
  max?: number;
  className?: string;
}) {
  const pct = (v: number) => `${(Math.min(v, max) / max) * 100}%`;
  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-4 text-body-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-outline" /> First attempt</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Latest</span>
      </div>
      <ul className="space-y-4">
        {rows.map((r) => {
          const lo = Math.min(r.first, r.latest);
          const hi = Math.max(r.first, r.latest);
          const delta = Math.round((r.latest - r.first) * 10) / 10;
          return (
            <li key={r.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-body-md">
                <span className="min-w-0 truncate">{r.label}</span>
                <span className="shrink-0 text-body-sm text-on-surface-variant tabular-nums">
                  {r.first} → <span className="font-semibold text-on-surface">{r.latest}</span>
                  {r.attempts > 1 && (
                    <span className={cn("ml-2", delta > 0 ? "text-success" : delta < 0 ? "text-error" : "")}>
                      {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-3" aria-label={`${r.label}: first ${r.first}, latest ${r.latest} out of ${max}`} role="img">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-outline-variant" />
                <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-on-surface-variant/40" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
                {r.attempts > 1 && <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-outline ring-2 ring-card" style={{ left: pct(r.first) }} />}
                <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card" style={{ left: pct(r.latest) }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
