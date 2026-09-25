"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = ["Reading your answers", "Scoring each question", "Checking communication patterns", "Writing your coaching summary"];

/** Shown while the report is generated in the background; polls and refreshes when ready. */
export function ReportPending({ id, initialStatus }: { id: string; initialStatus: "pending" | "failed" }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "pending") return;
    const tick = setInterval(() => {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
      setElapsed((e) => e + 1.5);
    }, 1500);
    const poll = setInterval(async () => {
      const res = await fetch(`/api/interviews/${id}/report`, { cache: "no-store" }).catch(() => null);
      const body = await res?.json().catch(() => null);
      if (body?.reportStatus === "ready") router.refresh();
      else if (body?.reportStatus === "failed") setStatus("failed");
    }, 1500);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [id, router, status]);

  async function retry() {
    setStatus("pending");
    setStep(0);
    setElapsed(0);
    await fetch(`/api/interviews/${id}/report`, { method: "POST" }).catch(() => null);
  }

  if (status === "failed" || elapsed > 150) {
    return (
      <div className="mx-auto max-w-lg rounded-[28px] bg-surface-container-low p-8 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-error-container text-on-error-container">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="text-headline-sm">We couldn&apos;t finish your report</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Your answers are saved. This is usually a temporary AI hiccup — try again.</p>
        <Button className="mt-6" onClick={() => void retry()}>
          <RotateCcw /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-center gap-4 rounded-[28px] bg-primary-container p-6 text-on-primary-container">
        <Loader2 className="size-8 animate-spin" />
        <div>
          <h1 className="text-title-lg">Generating your report…</h1>
          <p className="text-body-md opacity-85" aria-live="polite">
            {STEPS[step]}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Skeleton className="h-52 rounded-[28px]" />
        <Skeleton className="h-52 rounded-[28px]" />
      </div>
      <Skeleton className="h-40 rounded-[28px]" />
      <Skeleton className="h-64 rounded-[28px]" />
    </div>
  );
}
