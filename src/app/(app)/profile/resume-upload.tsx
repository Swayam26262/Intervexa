"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResumeUpload({ hasResume }: { hasResume: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading">("idle");
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  async function upload(file: File) {
    setState("uploading");
    setMessage(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/resume", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage({ tone: "error", text: data?.error ?? "Upload failed. Please try again." });
        return;
      }
      const filled: string[] = data?.profileUpdated ?? [];
      setMessage({
        tone: "ok",
        text: filled.length
          ? "Resume analysed. We also filled your skills and experience from it."
          : "Resume analysed.",
      });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Network error. Please try again." });
    } finally {
      setState("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="sr-only"
        id="resume-file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button type="button" variant={hasResume ? "outline" : "default"} disabled={state === "uploading"} onClick={() => inputRef.current?.click()}>
        {state === "uploading" ? <Loader2 className="animate-spin" /> : <FileUp />}
        {state === "uploading" ? "Analysing resume…" : hasResume ? "Replace resume" : "Upload resume"}
      </Button>
      <span className="text-xs text-muted-foreground">PDF, DOCX or TXT · max 5 MB</span>
      {message && (
        <p role="status" className={message.tone === "error" ? "w-full text-sm text-destructive" : "w-full text-sm text-success"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
