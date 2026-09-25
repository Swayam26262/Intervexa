"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

/** M3 segmented button (single select). Arrow keys move between segments. */
export function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex h-10 w-full rounded-full border border-outline", className)}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const next = (i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
              onChange(options[next].value);
              refs.current[next]?.focus();
            }}
            className={cn(
              "state-layer flex min-w-0 flex-1 items-center justify-center gap-1.5 px-3 text-label-lg transition-colors duration-150 first:rounded-l-full last:rounded-r-full [&:not(:first-child)]:border-l [&:not(:first-child)]:border-outline [&_svg]:size-4.5",
              selected ? "bg-secondary-container text-on-secondary-container" : "text-on-surface",
            )}
          >
            {selected ? <Check /> : o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
