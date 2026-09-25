"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { isFocusRoute } from "./nav-items";
import type { ThemePreference } from "./theme";

export interface ShellUser {
  name: string;
  email: string;
  image?: string | null;
}

/** M3 small top app bar: brand on mobile, plan chip + account on the trailing edge. */
export function TopBar({ user, planLabel, planTone, theme }: { user: ShellUser; planLabel: string | null; planTone: "pro" | "free" | "credits"; theme: ThemePreference }) {
  const pathname = usePathname();
  if (isFocusRoute(pathname)) return null;
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo href="/dashboard" className="md:invisible" />
        <div className="flex items-center gap-2">
          {planLabel && (
            <Link
              href="/billing"
              className={cn(
                "state-layer inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-label-lg",
                planTone === "pro" ? "bg-primary-container text-on-primary-container" : "border border-outline-variant text-on-surface-variant",
              )}
            >
              {planTone === "pro" ? <Sparkles className="size-4" /> : <Zap className="size-4" />}
              {planLabel}
            </Link>
          )}
          <AccountMenu name={user.name} email={user.email} image={user.image} theme={theme} />
        </div>
      </div>
    </header>
  );
}
