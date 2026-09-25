import * as React from "react";
import { cn } from "@/lib/utils";

/** M3 plain tooltip on hover/focus (CSS only). */
export function Tooltip({
  label,
  side = "bottom",
  children,
  className,
}: {
  label: string;
  side?: "top" | "bottom" | "right";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 rounded-md bg-inverse-surface px-2 py-1 text-body-sm whitespace-nowrap text-inverse-on-surface opacity-0 transition-opacity delay-300 duration-150 group-hover/tooltip:opacity-100 group-has-[:focus-visible]/tooltip:opacity-100",
          side === "bottom" && "top-full left-1/2 mt-1.5 -translate-x-1/2",
          side === "top" && "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
          side === "right" && "top-1/2 left-full ml-2 -translate-y-1/2",
        )}
      >
        {label}
      </span>
    </span>
  );
}
