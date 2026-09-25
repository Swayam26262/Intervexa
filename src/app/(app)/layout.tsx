import Link from "next/link";
import { cookies } from "next/headers";
import { FlaskConical, MailWarning } from "lucide-react";
import { BottomNav, NavRail } from "@/components/shell/nav-rail";
import { ShellMain } from "@/components/shell/focus-aware";
import { THEME_COOKIE, type ThemePreference } from "@/components/shell/theme";
import { TopBar } from "@/components/shell/top-bar";
import { isAiConfigured } from "@/lib/ai/client";
import { getEntitlements } from "@/lib/billing/service";
import { getUser } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  const [user, entitlements, cookieStore] = await Promise.all([getUser(userId), getEntitlements(userId), cookies()]);
  const theme = (cookieStore.get(THEME_COOKIE)?.value as ThemePreference) ?? "system";

  let planLabel: string | null = null;
  let planTone: "pro" | "free" | "credits" = "free";
  if (entitlements.tier === "pro") {
    planLabel = "Pro";
    planTone = "pro";
  } else if (entitlements.tier === "credits") {
    planLabel = `${entitlements.credits} credit${entitlements.credits === 1 ? "" : "s"}`;
    planTone = "credits";
  } else if (entitlements.tier === "free") {
    planLabel = `${Math.max(0, entitlements.freeLimit - entitlements.freeUsed)} free left`;
  }

  const banners = (
    <>
      {!isAiConfigured() && (
        <Banner icon={<FlaskConical />}>
          <strong className="font-semibold">Demo mode.</strong> No AI key is configured, so interviews use Intervexa&apos;s
          built-in offline interviewer.
        </Banner>
      )}
      {user && !user.emailVerified && user.provider === "credentials" && (
        <Banner icon={<MailWarning />} action={<Link href="/settings#email" className="text-label-lg text-primary hover:underline">Verify</Link>}>
          Verify your email so you can recover your account.
        </Banner>
      )}
    </>
  );

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <NavRail />
      <ShellMain
        topBar={
          <TopBar
            user={{ name: user?.name ?? "You", email: user?.email ?? "", image: user?.image }}
            planLabel={planLabel}
            planTone={planTone}
            theme={theme}
          />
        }
        banner={banners}
      >
        {children}
      </ShellMain>
      <BottomNav />
    </div>
  );
}

function Banner({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-1 sm:px-6">
      <div className="flex items-center gap-3 rounded-xl bg-surface-container px-4 py-2.5 text-body-md text-on-surface-variant [&_svg]:size-4.5 [&_svg]:shrink-0 [&_svg]:text-primary">
        {icon}
        <p className="flex-1">{children}</p>
        {action}
      </div>
    </div>
  );
}
