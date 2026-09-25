"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MenuContextValue {
  close: () => void;
}
const MenuContext = React.createContext<MenuContextValue>({ close: () => {} });

/** M3 menu: a trigger plus a popover list with keyboard support and click-outside dismissal. */
export function Menu({
  trigger,
  children,
  align = "end",
  label,
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  label: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    listRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onListKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
    next?.focus();
  }

  return (
    <MenuContext.Provider value={{ close: () => setOpen(false) }}>
      <div ref={rootRef} className="relative">
        {trigger({ open, toggle: () => setOpen((o) => !o), id })}
        {open && (
          <div
            ref={listRef}
            id={id}
            role="menu"
            aria-label={label}
            onKeyDown={onListKey}
            className={cn(
              "absolute z-50 mt-1 min-w-56 animate-rise-in overflow-hidden rounded-xl bg-surface-container py-2 shadow-elevation-2",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  );
}

const itemClasses =
  "state-layer flex h-12 w-full items-center gap-3 px-4 text-left text-body-lg text-on-surface outline-none [&_svg]:size-5 [&_svg]:text-on-surface-variant focus-visible:after:opacity-12";

export function MenuItem({
  href,
  onSelect,
  children,
  destructive,
}: {
  href?: string;
  onSelect?: () => void;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  const { close } = React.useContext(MenuContext);
  const cls = cn(itemClasses, destructive && "text-error [&_svg]:text-error");
  if (href) {
    return (
      <Link role="menuitem" href={href} className={cls} onClick={close}>
        {children}
      </Link>
    );
  }
  return (
    <button
      role="menuitem"
      type="button"
      className={cls}
      onClick={() => {
        close();
        onSelect?.();
      }}
    >
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div role="separator" className="my-2 h-px bg-outline-variant" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-2 pb-1 text-label-md text-on-surface-variant">{children}</div>;
}
