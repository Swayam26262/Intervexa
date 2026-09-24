"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Keyboard, Loader2, Mic, MicOff, Send, Square, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import type { AnswerMode } from "@/lib/interview/config";
import { cn } from "@/lib/utils";

export interface RoomTurn {
  index: number;
  topic: string;
  question: string;
  answer?: string;
}

export interface RoomData {
  id: string;
  title: string;
  subtitle: string;
  greeting: string;
  closing?: string;
  startedAt: string;
  durationMinutes: number;
  maxQuestions: number;
  answerMode: AnswerMode;
  demo: boolean;
  turns: RoomTurn[];
}

const MAX_ANSWER_CHARS = 5000;

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function InterviewRoom({ data }: { data: RoomData }) {
  const router = useRouter();
  const [turns, setTurns] = useState<RoomTurn[]>(data.turns);
  const [closing, setClosing] = useState<string | undefined>(data.closing);
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<AnswerMode>(data.answerMode);
  const [status, setStatus] = useState<"idle" | "sending" | "finishing">("idle");
  const [error, setError] = useState<string | null>(null);
  // Start from the server-known start time so server and client render the same clock.
  const [now, setNow] = useState(() => new Date(data.startedAt).getTime());
  const [readAloud, setReadAloud] = useState(data.answerMode === "voice");
  const questionShownAt = useRef(Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);
  const finishStarted = useRef(false);

  const appendTranscript = useCallback((text: string) => {
    if (!text) return;
    setAnswer((prev) => (prev ? `${prev.trimEnd()} ${text}` : text).slice(0, MAX_ANSWER_CHARS));
  }, []);
  const speech = useSpeechRecognition(appendTranscript);
  const tts = useSpeechSynthesis();
  const { stop: stopListening } = speech;
  const { speak, cancel: cancelSpeech, supported: ttsSupported } = tts;

  const current = turns[turns.length - 1];
  const awaitingAnswer = !closing && current && current.answer === undefined;
  const elapsed = (now - new Date(data.startedAt).getTime()) / 1000;
  const remaining = data.durationMinutes * 60 - elapsed;
  const timeUp = remaining <= 0;

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, closing, status]);

  // Read each new interviewer message aloud (if enabled).
  const lastSpoken = useRef<string | null>(null);
  useEffect(() => {
    const text = closing ?? (awaitingAnswer ? (turns.length === 1 ? `${data.greeting} ${current.question}` : current.question) : null);
    if (!text || text === lastSpoken.current) return;
    lastSpoken.current = text;
    questionShownAt.current = Date.now();
    if (readAloud && ttsSupported) speak(text);
  }, [closing, awaitingAnswer, current, turns.length, data.greeting, readAloud, ttsSupported, speak]);

  const finish = useCallback(async () => {
    if (finishStarted.current) return;
    finishStarted.current = true;
    stopListening();
    cancelSpeech();
    setStatus("finishing");
    setError(null);
    try {
      const res = await fetch(`/api/interviews/${data.id}/finish`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not generate your report.");
      router.push(body.status === "discarded" ? "/dashboard" : `/interview/${data.id}/report`);
      router.refresh();
    } catch (err) {
      finishStarted.current = false;
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Could not generate your report.");
    }
  }, [data.id, router, stopListening, cancelSpeech]);

  // Generate the report automatically once the interviewer has closed the interview.
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => void finish(), 2500);
    return () => clearTimeout(t);
  }, [closing, finish]);

  async function submit() {
    const text = answer.trim();
    if (!text || status !== "idle" || !awaitingAnswer) return;
    const wasListening = speech.listening;
    speech.stop();
    tts.cancel();
    const spokenSeconds = speech.takeSpeakingSeconds();
    const inputMode: AnswerMode = spokenSeconds > 0 ? "voice" : "text";
    const durationSec = inputMode === "voice" ? spokenSeconds : (Date.now() - questionShownAt.current) / 1000;

    setStatus("sending");
    setError(null);
    try {
      const res = await fetch(`/api/interviews/${data.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: text, inputMode, durationSec: Math.round(durationSec) }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 409) {
        router.refresh();
        throw new Error(body?.error ?? "This interview was updated elsewhere.");
      }
      if (!res.ok) throw new Error(body?.error ?? "Something went wrong. Your answer is still here — try again.");

      setTurns((prev) => {
        const updated = prev.map((t, i) => (i === prev.length - 1 ? { ...t, answer: text } : t));
        return body.turn ? [...updated, { index: body.turn.index, topic: body.turn.topic, question: body.turn.question }] : updated;
      });
      if (body.done) setClosing(body.message);
      setAnswer("");
      if (wasListening && !body.done && mode === "voice" && !readAloud) speech.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStatus("idle");
    }
  }

  function endInterview() {
    const answered = turns.filter((t) => t.answer !== undefined).length;
    const message = answered
      ? "End the interview now and generate your report?"
      : "You haven't answered any questions yet. End and discard this interview?";
    if (window.confirm(message)) void finish();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="min-w-0">
          <div className="truncate font-semibold">{data.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {data.subtitle}
            {data.demo && " · demo interviewer"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            Q{turns.length} / ~{data.maxQuestions}
          </Badge>
          <Badge variant={timeUp ? "destructive" : remaining < 120 ? "warning" : "outline"} className="tabular-nums">
            <Clock /> {timeUp ? "Time's up" : `${formatClock(elapsed)} / ${data.durationMinutes}:00`}
          </Badge>
          <Button variant="outline" size="sm" onClick={endInterview} disabled={status !== "idle"}>
            <Square className="size-3" /> End
          </Button>
        </div>
      </div>

      <div className="space-y-4 pb-2" aria-live="polite">
        <InterviewerBubble>{data.greeting}</InterviewerBubble>
        {turns.map((t) => (
          <div key={t.index} className="space-y-4">
            <InterviewerBubble topic={t.topic}>{t.question}</InterviewerBubble>
            {t.answer !== undefined && <CandidateBubble>{t.answer}</CandidateBubble>}
          </div>
        ))}
        {status === "sending" && (
          <div className="flex items-center gap-2 pl-1 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Interviewer is thinking…
          </div>
        )}
        {closing && <InterviewerBubble>{closing}</InterviewerBubble>}
        {status === "finishing" && (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-card p-6 text-sm">
            <Loader2 className="size-4 animate-spin text-primary" /> Generating your interview report…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {awaitingAnswer && status !== "finishing" && (
        <div className="sticky bottom-3 z-20 rounded-xl border bg-card p-3 shadow-lg">
          {timeUp && (
            <p className="mb-2 text-xs text-warning">Time&apos;s up — submit this answer and the interviewer will wrap up.</p>
          )}
          {mode === "voice" && (
            <div className="mb-3 flex flex-col items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => {
                  if (speech.listening) {
                    speech.stop();
                  } else {
                    tts.cancel();
                    speech.start();
                  }
                }}
                disabled={!speech.supported || status !== "idle"}
                aria-label={speech.listening ? "Stop recording" : "Start recording"}
                className={cn(
                  "grid size-16 place-items-center rounded-full text-white shadow-md transition disabled:opacity-50",
                  speech.listening ? "animate-pulse-ring bg-destructive" : "bg-primary hover:bg-primary/90",
                )}
              >
                {speech.listening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
              </button>
              <div className="text-xs text-muted-foreground">
                {!speech.supported
                  ? "Voice input isn't supported in this browser — try Chrome or Edge, or type below."
                  : speech.listening
                    ? "Listening… tap to pause. You can edit the transcript before sending."
                    : "Tap the mic and answer out loud."}
              </div>
              {speech.interim && <div className="text-sm italic text-muted-foreground">“{speech.interim}”</div>}
              {speech.error && <div className="text-xs text-destructive">{speech.error}</div>}
            </div>
          )}
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={mode === "voice" ? "Your spoken answer appears here…" : "Type your answer… (Ctrl/⌘ + Enter to send)"}
            rows={mode === "voice" ? 3 : 4}
            disabled={status !== "idle"}
            aria-label="Your answer"
            className="resize-none border-0 shadow-none focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (mode === "voice") speech.stop();
                  setMode(mode === "voice" ? "text" : "voice");
                }}
              >
                {mode === "voice" ? <Keyboard /> : <Mic />}
                {mode === "voice" ? "Type instead" : "Answer by voice"}
              </Button>
              {tts.supported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={readAloud}
                  onClick={() => {
                    if (readAloud) tts.cancel();
                    setReadAloud(!readAloud);
                  }}
                  title={readAloud ? "Stop reading questions aloud" : "Read questions aloud"}
                >
                  {readAloud ? <Volume2 /> : <VolumeX />}
                  <span className="hidden sm:inline">{readAloud ? "Voice on" : "Voice off"}</span>
                </Button>
              )}
            </div>
            <Button onClick={() => void submit()} disabled={!answer.trim() || status !== "idle"}>
              {status === "sending" ? <Loader2 className="animate-spin" /> : <Send />}
              Send answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewerBubble({ topic, children }: { topic?: string; children: React.ReactNode }) {
  return (
    <div className="mr-8 sm:mr-16">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <span className="grid size-5 place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-[10px] font-bold text-white">
          I
        </span>
        Interviewer
        {topic && <span className="font-normal">· {topic}</span>}
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 leading-relaxed">{children}</div>
    </div>
  );
}

function CandidateBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-8 sm:ml-16">
      <div className="mb-1 text-right text-[11px] font-medium text-muted-foreground">You</div>
      <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 leading-relaxed whitespace-pre-wrap text-primary-foreground">
        {children}
      </div>
    </div>
  );
}
