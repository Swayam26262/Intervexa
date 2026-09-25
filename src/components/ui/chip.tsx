import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** M3 filter chip — a toggle with a leading check when selected. */
function FilterChip({
  selected,
  className,
  children,
  icon,
  ...props
}: React.ComponentProps<"button"> & { selected: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "state-layer inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-label-lg transition-colors duration-150 [&_svg]:size-4.5",
        selected
          ? "border-transparent bg-secondary-container text-on-secondary-container"
          : "border-outline text-on-surface-variant",
        className,
      )}
      {...props}
    >
      {selected ? <Check /> : icon}
      {children}
    </button>
  );
}

/** M3 input chip — a removable value. */
function InputChip({ children, onRemove, className }: { children: React.ReactNode; onRemove?: () => void; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-low pr-1 pl-3 text-label-lg text-on-surface-variant",
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === "string" ? children : "item"}`}
          className="state-layer grid size-6 place-items-center rounded-full"
        >
          <X className="size-4" />
        </button>
      )}
    </span>
  );
}

/** M3 assist chip — a compact action or label. */
function AssistChip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-label-lg text-on-surface [&_svg]:size-4.5 [&_svg]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

export { AssistChip, FilterChip, InputChip };
