import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import { isAiConfigured } from "@/lib/ai/client";
import { requireUserId } from "@/lib/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();
  const demo = !isAiConfigured();
  return (
    <div className="min-h-dvh">
      {demo && (
        <div className="bg-warning/15 px-4 py-1.5 text-center text-xs text-foreground">
          <strong>Demo mode:</strong> no <code className="font-mono">GEMINI_API_KEY</code> set, so interviews use Intervexa&apos;s
          built-in offline interviewer. Add a key for the full AI experience.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo href="/dashboard" className="hidden sm:flex" />
            <NavLinks />
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
