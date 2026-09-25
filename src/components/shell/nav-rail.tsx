"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";
import { isActive, isFocusRoute, MOBILE_NAV_ITEMS, NAV_ITEMS } from "./nav-items";

/** M3 navigation rail (≥ md): FAB on top, destinations with a pill active indicator. */
export function NavRail() {
  const pathname = usePathname();
  if (isFocusRoute(pathname)) return null;
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center gap-3 bg-surface-container-low py-4 md:flex"
    >
      <Link href="/dashboard" aria-label="Intervexa home" className="mb-1">
        <LogoMark />
      </Link>
      <Link
        href="/interview/new"
        aria-label="New interview"
        className="state-layer mb-4 grid size-14 place-items-center rounded-2xl bg-primary-container text-on-primary-container shadow-elevation-1 transition-shadow hover:shadow-elevation-2"
      >
        <Plus className="size-6" />
      </Link>
      <ul className="flex flex-col gap-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="group flex w-14 flex-col items-center gap-1 text-label-md"
              >
                <span
                  className={cn(
                    "state-layer grid h-8 w-14 place-items-center rounded-full transition-colors duration-200",
                    active ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={active ? "text-on-surface" : "text-on-surface-variant"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** M3 navigation bar (< md) plus an extended FAB for starting an interview. */
export function BottomNav() {
  const pathname = usePathname();
  if (isFocusRoute(pathname)) return null;
  const showFab = pathname !== "/interview/new";
  return (
    <>
      {showFab && (
        <Link
          href="/interview/new"
          className="state-layer fixed right-4 bottom-24 z-40 flex h-14 items-center gap-2 rounded-2xl bg-primary-container px-4 text-label-lg text-on-primary-container shadow-elevation-3 md:hidden"
        >
          <Plus className="size-6" /> New interview
        </Link>
      )}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid h-20 grid-cols-5 bg-surface-container pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-1 text-label-md"
            >
              <span
                className={cn(
                  "grid h-8 w-16 place-items-center rounded-full transition-colors duration-200",
                  active ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={active ? "text-on-surface" : "text-on-surface-variant"}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
