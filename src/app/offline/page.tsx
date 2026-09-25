import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Offline" };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <Logo className="mb-10 justify-center" />
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-surface-container-high">
          <WifiOff className="size-7" />
        </span>
        <h1 className="text-headline-sm">You&apos;re offline</h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">Interviews need a connection. We&apos;ll be right here when you&apos;re back online.</p>
      </div>
    </main>
  );
}
