import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <Logo className="mb-10 justify-center" />
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-primary-container text-on-primary-container">
          <Compass className="size-7" />
        </span>
        <h1 className="text-headline-md">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">It may have been moved, or the interview may belong to another account.</p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
