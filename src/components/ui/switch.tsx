"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** M3 switch. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group relative inline-flex h-8 w-13 shrink-0 items-center rounded-full border-2 transition-colors duration-200 disabled:opacity-40",
        checked ? "border-primary bg-primary" : "border-outline bg-surface-container-highest",
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-full shadow-sm transition-all duration-200 ease-[var(--ease-emphasized)]",
          checked ? "ml-[22px] size-6 bg-on-primary text-primary" : "ml-1.5 size-4 bg-outline group-hover:bg-on-surface-variant",
        )}
      >
        {checked && <Check className="size-4" strokeWidth={3} />}
      </span>
    </button>
  );
}
