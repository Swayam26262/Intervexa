"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface LinePoint {
  x: Date;
  y: number;
  /** Extra rows for the tooltip (label → value). */
  meta?: { label: string; value: string }[];
}

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

/**
 * Single-series line chart: 2px line, 10% area wash, ringed markers, hairline grid,
 * crosshair + tooltip that snaps to the nearest point, keyboard navigable, with an end label.
 */
export function LineChart({
  points,
  yMax = 100,
  yTicks = [0, 25, 50, 75, 100],
  height = 240,
  valueSuffix = "",
  ariaLabel,
  className,
}: {
  points: LinePoint[];
  yMax?: number;
  yTicks?: number[];
  height?: number;
  valueSuffix?: string;
  ariaLabel: string;
  className?: string;
}) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  // Draw at the real pixel width so text and strokes are never scaled.
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const pad = { top: 16, right: 40, bottom: 28, left: 32 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const coords = useMemo(
    () =>
      points.map((p, i) => ({
        x: pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
        y: pad.top + innerH - (Math.min(p.y, yMax) / yMax) * innerH,
      })),
    [points, innerW, innerH, yMax, pad.left, pad.top],
  );

  if (!points.length) return null;
  const line = coords.map((c, i) => `${i ? "L" : "M"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x},${pad.top + innerH} L${coords[0].x},${pad.top + innerH} Z`;
  const last = coords[coords.length - 1];
  const xLabels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const sameDay = points.length > 1 && points[0].x.toDateString() === points[points.length - 1].x.toDateString();
  const fmtX = sameDay ? fmtTime : fmtDate;

  function nearest(clientX: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    coords.forEach((c, i) => {
      if (Math.abs(c.x - x) < Math.abs(coords[best].x - x)) best = i;
    });
    setActive(best);
  }

  const a = active !== null ? coords[active] : null;
  const ap = active !== null ? points[active] : null;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={wrapRef}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerMove={(e) => nearest(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? points.length) - 1));
          if (e.key === "ArrowRight") setActive((i) => Math.min(points.length - 1, (i ?? -1) + 1));
        }}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block w-full" aria-hidden>
          <defs>
            <clipPath id={`${id}-clip`}>
              <rect x={pad.left} y={pad.top - 6} width={innerW + 6} height={innerH + 12} />
            </clipPath>
          </defs>
          {yTicks.map((t) => {
            const y = pad.top + innerH - (t / yMax) * innerH;
            return (
              <g key={t}>
                <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} className={t === 0 ? "stroke-outline" : "stroke-outline-variant"} strokeWidth={1} />
                <text x={pad.left - 8} y={y} dy="0.32em" textAnchor="end" className="fill-on-surface-variant text-[11px] tabular-nums">
                  {t}
                </text>
              </g>
            );
          })}
          {xLabels.map((i) => (
            <text
              key={i}
              x={coords[i].x}
              y={H - 8}
              textAnchor={i === 0 && points.length > 1 ? "start" : i === points.length - 1 && points.length > 1 ? "end" : "middle"}
              className="fill-on-surface-variant text-[11px]"
            >
              {fmtX(points[i].x)}
            </text>
          ))}
          <g clipPath={`url(#${id}-clip)`}>
            <path d={area} className="fill-primary" fillOpacity={0.1} />
            <path d={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </g>
          {a && <line x1={a.x} x2={a.x} y1={pad.top} y2={pad.top + innerH} className="stroke-outline" strokeWidth={1} />}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={i === active ? 5.5 : 4}
              className="fill-primary stroke-card"
              strokeWidth={2}
            />
          ))}
          <text x={last.x + 8} y={last.y} dy="0.32em" className="fill-on-surface text-[12px] font-semibold">
            {points[points.length - 1].y}
            {valueSuffix}
          </text>
        </svg>
      </div>
      {a && ap && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 min-w-40 -translate-x-1/2 -translate-y-full rounded-xl bg-inverse-surface px-3 py-2 text-inverse-on-surface shadow-elevation-2"
          style={{ left: `${(a.x / W) * 100}%`, top: `calc(${(a.y / H) * 100}% - 12px)` }}
        >
          <div className="flex items-baseline gap-2">
            <span className="h-0.5 w-3 rounded-full bg-inverse-primary" aria-hidden />
            <span className="text-title-md">
              {ap.y}
              {valueSuffix}
            </span>
            <span className="text-body-sm opacity-80">{sameDay ? `${fmtDate(ap.x)}, ${fmtTime(ap.x)}` : fmtDate(ap.x)}</span>
          </div>
          {ap.meta?.map((m) => (
            <div key={m.label} className="mt-0.5 flex justify-between gap-4 text-body-sm">
              <span className="opacity-75">{m.label}</span>
              <span>{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
