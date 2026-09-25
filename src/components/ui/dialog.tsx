"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * M3 basic dialog built on the native <dialog> element: focus trapping, Esc to close and
 * top-layer rendering come from the browser.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  actions,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === ref.current) onOpenChange(false);
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[min(560px,calc(100vw-32px))] rounded-[28px] bg-surface-container-high p-0 text-on-surface shadow-elevation-3 backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:animate-rise-in",
        className,
      )}
    >
      {open && (
        <div className="p-6">
          {icon && <div className="mb-4 flex justify-center text-secondary [&_svg]:size-6">{icon}</div>}
          <h2 id="dialog-title" className={cn("text-headline-sm", icon && "text-center")}>
            {title}
          </h2>
          {description && <div className="mt-4 text-body-md text-on-surface-variant">{description}</div>}
          {children && <div className="mt-4">{children}</div>}
          {actions && <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>}
        </div>
      )}
    </dialog>
  );
}
