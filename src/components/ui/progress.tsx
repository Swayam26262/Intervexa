import * as React from "react";
import { cn } from "@/lib/utils";

/** M3 linear progress: rounded indicator with a small gap before the track. */
function Progress({
  value,
  className,
  indicatorClassName,
  ...props
}: React.ComponentProps<"div"> & { value: number; indicatorClassName?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("relative flex h-1.5 w-full items-center gap-1", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-500 ease-[var(--ease-emphasized)]", indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
      {pct < 100 && <div className="h-full flex-1 rounded-full bg-surface-container-highest" />}
    </div>
  );
}

/** M3 circular progress / score ring. */
function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  className,
  indicatorClassName = "stroke-primary",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  indicatorClassName?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-container-highest" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700 ease-[var(--ease-emphasized)]", indicatorClassName)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export { Progress, ProgressRing };
