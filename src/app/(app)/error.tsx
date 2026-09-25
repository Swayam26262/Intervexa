"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-error-container text-on-error-container">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="text-headline-sm">Something went wrong</h1>
      <p className="mt-2 text-body-lg text-on-surface-variant">
        Your interviews and reports are safe. Try again, or head back to your dashboard.
      </p>
      {error.digest && <p className="mt-2 font-mono text-body-sm text-on-surface-variant">Reference: {error.digest}</p>}
      <div className="mt-8 flex justify-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button onClick={reset}>
          <RotateCcw /> Try again
        </Button>
      </div>
    </div>
  );
}
