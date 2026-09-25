import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** M3 primary tabs rendered as links (URL-driven state). */
export function LinkTabs({
  tabs,
  active,
  className,
}: {
  tabs: { href: string; label: string; value: string; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={cn("scrollbar-none flex overflow-x-auto border-b border-outline-variant", className)}>
      {tabs.map((t) => {
        const selected = t.value === active;
        return (
          <Link
            key={t.value}
            href={t.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "state-layer relative flex h-12 shrink-0 items-center gap-2 px-4 text-title-sm whitespace-nowrap",
              selected ? "text-primary" : "text-on-surface-variant",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="rounded-full bg-surface-container-highest px-1.5 text-label-sm text-on-surface-variant">{t.count}</span>
            )}
            {selected && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}
