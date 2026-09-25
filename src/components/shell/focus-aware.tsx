"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isFocusRoute } from "./nav-items";

/** Offsets content for the rail / bottom bar, except on focus routes (the interview room). */
export function ShellMain({
  topBar,
  banner,
  children,
}: {
  topBar: React.ReactNode;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const focus = isFocusRoute(usePathname());
  return (
    <div className={cn(!focus && "md:pl-20")}>
      {!focus && topBar}
      {!focus && banner}
      <main
        id="main"
        className={cn("mx-auto w-full", focus ? "max-w-none" : "max-w-6xl px-4 pt-2 pb-36 sm:px-6 md:pb-16")}
      >
        {children}
      </main>
    </div>
  );
}
