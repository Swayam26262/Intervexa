"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function StartRound({ loopId, index, resume, voice }: { loopId: string; index: number; resume: boolean; voice: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<"text" | "voice" | null>(null);
  async function start(answerMode: "text" | "voice") {
    setPending(answerMode);
    try {
      const res = await fetch(`/api/loops/${loopId}/rounds/${index}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerMode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not start the round.");
      router.push(`/interview/${data.interviewId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the round.");
      setPending(null);
    }
  }
  return (
    <div className="flex gap-2">
      {!resume && voice && (
        <Button variant="tonal" onClick={() => void start("voice")} disabled={pending !== null}>
          {pending === "voice" ? <Loader2 className="animate-spin" /> : <Mic />} Voice
        </Button>
      )}
      <Button onClick={() => void start("text")} disabled={pending !== null}>
        {pending === "text" ? <Loader2 className="animate-spin" /> : null}
        {resume ? "Resume round" : "Start round"} <ArrowRight />
      </Button>
    </div>
  );
}
