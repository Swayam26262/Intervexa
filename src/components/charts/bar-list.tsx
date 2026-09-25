import { cn } from "@/lib/utils";

/**
 * Horizontal bar list (one series → one color). Bars are ≤ 8px thick with a rounded data
 * end and a square baseline; the value sits at the tip in text ink.
 */
export function BarList({
  items,
  max = 100,
  valueFormat = (v: number) => String(v),
  className,
}: {
  items: { label: React.ReactNode; value: number; hint?: string; key: string }[];
  max?: number;
  valueFormat?: (v: number) => string;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item.key} title={item.hint}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-body-md">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="tabular-nums text-on-surface-variant">{valueFormat(item.value)}</span>
          </div>
          <div className="h-2 w-full rounded-r-[4px] bg-surface-container-highest">
            <div className="h-full rounded-r-[4px] bg-primary" style={{ width: `${Math.max(1.5, Math.min(100, (item.value / max) * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
