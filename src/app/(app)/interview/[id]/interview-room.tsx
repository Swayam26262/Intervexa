"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Clock,
  Code2,
  Keyboard,
  Loader2,
  MessagesSquare,
  Mic,
  MicOff,
  PenTool,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SegmentedButton } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import type { RunOutcome } from "@/lib/coding/runner";
import type { PublicProblem } from "@/lib/interview/coding-problems";
import type { AnswerMode } from "@/lib/interview/config";
import type { CodeLanguage, SpeechMetrics } from "@/lib/interview/types";
import { cn } from "@/lib/utils";
// Heavy editors load only for rounds that use them.
const CodeWorkspace = dynamic(() => import("./code-workspace").then((m) => m.CodeWorkspace), {
  ssr: false,
  loading: () => <PaneLoading label="Loading editor…" />,
});
const Whiteboard = dynamic(() => import("./whiteboard").then((m) => m.Whiteboard), {
  ssr: false,
  loading: () => <PaneLoading label="Loading whiteboard…" />,
});

function PaneLoading({ label }: { label: string }) {
  return (
    <div className="grid h-full min-h-[320px] place-items-center rounded-3xl border border-outline-variant text-body-md text-on-surface-variant">
      <span className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> {label}
      </span>
    </div>
  );
}

export interface RoomTurn {
  index: number;
  topic: string;
  question: string;
  answer?: string;
  attachments?: string[];
}

export interface RoomData {
  id: string;
  title: string;
  subtitle: string;
  interviewerLabel: string;
  greeting: string;
  closing?: string;
  startedAt: string;
  durationMinutes: number;
  maxQuestions: number;
  answerMode: AnswerMode;
  speechLang: string;
  languageCode: string;
  demo: boolean;
  serverStt: boolean;
  whiteboard: boolean;
  problem?: PublicProblem;
  codeLanguage?: CodeLanguage;
  turns: RoomTurn[];
}

const MAX_ANSWER_CHARS = 5000;

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Reads a Server-Sent Events response, calling `onEvent` for each event. */
async function readSse(res: Response, onEvent: (event: string, data: unknown) => void) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const event = block.match(/^event: (.*)$/m)?.[1] ?? "message";
      const data = block.match(/^data: (.*)$/m)?.[1];
      if (data) onEvent(event, JSON.parse(data));
    }
  }
}

export function InterviewRoom({ data }: { data: RoomData }) {
  const router = useRouter();
  const [turns, setTurns] = useState<RoomTurn[]>(data.turns);
  const [closing, setClosing] = useState<string | undefined>(data.closing);
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<AnswerMode>(data.answerMode);
  const [status, setStatus] = useState<"idle" | "sending" | "finishing">("idle");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date(data.startedAt).getTime());
  const [readAloud, setReadAloud] = useState(data.answerMode === "voice");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const hasWorkspace = Boolean(data.problem) || data.whiteboard;
  const [pane, setPane] = useState<"chat" | "work">("chat");
  const [whiteboardOpen, setWhiteboardOpen] = useState(Boolean(data.problem) || data.whiteboard);
  const [code, setCode] = useState(data.problem?.starter[data.codeLanguage ?? "javascript"] ?? "");
  const [lastRun, setLastRun] = useState<RunOutcome | null>(null);
  const [diagram, setDiagram] = useState("");
  const sent = useRef({ code: data.problem?.starter[data.codeLanguage ?? "javascript"] ?? "", diagram: "" });
  const questionShownAt = useRef(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const finishStarted = useRef(false);

  const appendTranscript = useCallback((text: string) => {
    if (!text) return;
    setAnswer((prev) => (prev ? `${prev.trimEnd()} ${text}` : text).slice(0, MAX_ANSWER_CHARS));
  }, []);
  const speech = useSpeechRecognition(appendTranscript, data.speechLang);
  const recorder = useRecorder();
  const tts = useSpeechSynthesis(data.speechLang);
  const { stop: stopListening } = speech;
  const { speak, cancel: cancelSpeech, supported: ttsSupported } = tts;
  const useServerStt = !speech.supported && data.serverStt && recorder.supported;
  const voiceAvailable = speech.supported || useServerStt;
  const listening = speech.listening || recorder.recording;
  const recorderSecs = useRef(0);

  const current = turns[turns.length - 1];
  const awaitingAnswer = !closing && current && current.answer === undefined;
  const elapsed = (now - new Date(data.startedAt).getTime()) / 1000;
  const remaining = data.durationMinutes * 60 - elapsed;
  const timeUp = remaining <= 0;
  const codeChanged = Boolean(data.problem) && code.trim() !== sent.current.code.trim();
  const diagramChanged = Boolean(diagram) && diagram !== sent.current.diagram;

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length, closing, status, streaming]);

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
    try {
      const res = await fetch(`/api/interviews/${data.id}/finish`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not end the interview.");
      router.push(body.status === "discarded" ? "/dashboard" : `/interview/${data.id}/report`);
      router.refresh();
    } catch (err) {
      finishStarted.current = false;
      setStatus("idle");
      toast.error(err instanceof Error ? err.message : "Could not end the interview.");
    }
  }, [data.id, router, stopListening, cancelSpeech]);

  // End automatically shortly after the interviewer's closing remarks.
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => void finish(), 2500);
    return () => clearTimeout(t);
  }, [closing, finish]);

  async function toggleMic() {
    if (useServerStt) {
      if (recorder.recording) {
        const rec = await recorder.stop();
        if (!rec) return;
        recorderSecs.current += rec.seconds;
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", rec.blob, "answer.webm");
          form.append("language", data.languageCode);
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error(body?.error ?? "Transcription failed");
          appendTranscript(body.text);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setTranscribing(false);
        }
      } else {
        cancelSpeech();
        await recorder.start();
      }
      return;
    }
    if (speech.listening) speech.stop();
    else {
      cancelSpeech();
      speech.start();
    }
  }

  async function submit() {
    const text = answer.trim();
    if (!text || status !== "idle" || !awaitingAnswer || transcribing) return;
    if (recorder.recording) {
      toast.message("Stop recording first so we can transcribe your answer.");
      return;
    }
    speech.stop();
    cancelSpeech();
    const metrics = speech.takeMetrics();
    const spokenSeconds = metrics.seconds + recorderSecs.current;
    recorderSecs.current = 0;
    const inputMode: AnswerMode = spokenSeconds > 0 ? "voice" : "text";
    const durationSec = inputMode === "voice" ? spokenSeconds : (Date.now() - questionShownAt.current) / 1000;
    const speechMetrics: SpeechMetrics | undefined = metrics.seconds > 0 ? metrics.speech : undefined;
    const attachments: string[] = [];
    const codePayload =
      data.problem && codeChanged
        ? {
            language: data.codeLanguage ?? "javascript",
            source: code,
            ...(lastRun ? { tests: { passed: lastRun.passed, total: lastRun.total, results: lastRun.results.slice(0, 30) } } : {}),
          }
        : undefined;
    if (codePayload) attachments.push(lastRun ? `Code · ${lastRun.passed}/${lastRun.total} tests` : "Code");
    const diagramPayload = diagramChanged ? { summary: diagram } : undefined;
    if (diagramPayload) attachments.push("Whiteboard");

    setStatus("sending");
    setStreaming("");
    try {
      const res = await fetch(`/api/interviews/${data.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          answer: text,
          turnIndex: current.index,
          inputMode,
          durationSec: Math.round(durationSec),
          code: codePayload,
          diagram: diagramPayload,
          speech: speechMetrics,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) router.refresh();
        throw new Error(body?.error ?? "Something went wrong. Your answer is still here — try again.");
      }
      type Outcome = { done: boolean; message: string; turn?: { index: number; topic: string; question: string } };
      let outcome: Outcome | null = null;
      let failure: string | null = null;
      await readSse(res, (event, payload) => {
        if (event === "delta") setStreaming((s) => (s ?? "") + (payload as { text: string }).text);
        else if (event === "done") outcome = payload as Outcome;
        else if (event === "error") failure = (payload as { error?: string }).error ?? "Something went wrong.";
      });
      if (failure || !outcome) throw new Error(failure ?? "The connection dropped. Your answer is still here — try again.");
      const result: Outcome = outcome;
      if (codePayload) sent.current.code = code;
      if (diagramPayload) sent.current.diagram = diagram;
      setTurns((prev) => {
        const updated = prev.map((t, i) => (i === prev.length - 1 ? { ...t, answer: text, attachments } : t));
        return result.turn ? [...updated, { index: result.turn.index, topic: result.turn.topic, question: result.turn.question }] : updated;
      });
      if (result.done) setClosing(result.message);
      setAnswer("");
      setLastRun(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStreaming(null);
      setStatus("idle");
    }
  }

  const answeredCount = turns.filter((t) => t.answer !== undefined).length;
  const progressPct = Math.min(100, (elapsed / (data.durationMinutes * 60)) * 100);
  const workspaceLabel = data.problem ? "Code" : "Whiteboard";

  const conversation = (
    <section className={cn("flex min-h-0 flex-col", hasWorkspace && pane !== "chat" && "hidden lg:flex")} aria-label="Conversation">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5 py-6" aria-live="polite">
          <InterviewerPresence label={data.interviewerLabel} speaking={tts.speaking} thinking={status === "sending" && !streaming} />
          {data.problem && <ProblemCard problem={data.problem} />}
          <InterviewerBubble>{data.greeting}</InterviewerBubble>
          {turns.map((t) => (
            <div key={t.index} className="space-y-5">
              <InterviewerBubble topic={t.topic}>{t.question}</InterviewerBubble>
              {t.answer !== undefined && <CandidateBubble attachments={t.attachments}>{t.answer}</CandidateBubble>}
            </div>
          ))}
          {streaming !== null && streaming.length > 0 && (
            <InterviewerBubble>
              {streaming}
              <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-primary" aria-hidden />
            </InterviewerBubble>
          )}
          {closing && <InterviewerBubble>{closing}</InterviewerBubble>}
          {status === "finishing" && (
            <div className="flex items-center justify-center gap-2 rounded-3xl bg-surface-container-low p-6 text-body-md">
              <Loader2 className="size-4 animate-spin text-primary" /> Wrapping up your interview…
            </div>
          )}
        </div>
      </div>

      {awaitingAnswer && status !== "finishing" && (
        <div className="px-3 pb-3 sm:px-6 sm:pb-5">
          <div className="mx-auto max-w-3xl">
            {timeUp && <p className="mb-2 px-2 text-body-sm text-warning">Time&apos;s up — send this answer and the interviewer will wrap up.</p>}
            <div className="rounded-[28px] bg-surface-container-high p-2 shadow-elevation-1 transition-shadow focus-within:shadow-elevation-2">
              {mode === "voice" && (
                <VoicePanel
                  available={voiceAvailable}
                  listening={listening}
                  transcribing={transcribing}
                  serverMode={useServerStt}
                  interim={speech.interim}
                  error={speech.error ?? recorder.error}
                  disabled={status !== "idle"}
                  onToggle={() => void toggleMic()}
                />
              )}
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                rows={mode === "voice" ? 2 : 3}
                disabled={status !== "idle"}
                aria-label="Your answer"
                placeholder={
                  mode === "voice"
                    ? "Your spoken answer appears here — edit it before sending…"
                    : data.problem
                      ? "Explain your approach or answer the question… (Ctrl/⌘ + Enter to send)"
                      : "Type your answer… (Ctrl/⌘ + Enter to send)"
                }
                className="field-sizing-content max-h-60 min-h-12 w-full resize-none bg-transparent px-3 py-2 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/70"
              />
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex min-w-0 items-center gap-1">
                  <Tooltip label={mode === "voice" ? "Type instead" : "Answer by voice"} side="top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={mode === "voice" ? "Type instead" : "Answer by voice"}
                      onClick={() => {
                        if (mode === "voice") speech.stop();
                        setMode(mode === "voice" ? "text" : "voice");
                      }}
                    >
                      {mode === "voice" ? <Keyboard /> : <Mic />}
                    </Button>
                  </Tooltip>
                  {ttsSupported && (
                    <Tooltip label={readAloud ? "Stop reading questions aloud" : "Read questions aloud"} side="top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-pressed={readAloud}
                        aria-label={readAloud ? "Stop reading questions aloud" : "Read questions aloud"}
                        onClick={() => {
                          if (readAloud) cancelSpeech();
                          setReadAloud(!readAloud);
                        }}
                      >
                        {readAloud ? <Volume2 /> : <VolumeX />}
                      </Button>
                    </Tooltip>
                  )}
                  <div className="flex min-w-0 gap-1.5 overflow-x-auto scrollbar-none">
                    {codeChanged && (
                      <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-secondary-container px-2 text-label-md text-on-secondary-container">
                        <Code2 className="size-3.5" /> Code{lastRun ? ` · ${lastRun.passed}/${lastRun.total}` : ""} attached
                      </span>
                    )}
                    {diagramChanged && (
                      <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-secondary-container px-2 text-label-md text-on-secondary-container">
                        <PenTool className="size-3.5" /> Whiteboard attached
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  aria-label="Send answer"
                  onClick={() => void submit()}
                  disabled={!answer.trim() || status !== "idle" || transcribing}
                >
                  {status === "sending" ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const workspace = hasWorkspace ? (
    <section
      className={cn(
        "min-h-0 p-3 sm:p-4 lg:pl-0",
        pane !== "work" && "hidden",
        whiteboardOpen ? "lg:block" : "lg:hidden",
      )}
      aria-label={workspaceLabel}
    >
      {data.problem ? (
        <CodeWorkspace
          problem={data.problem}
          language={data.codeLanguage ?? "javascript"}
          storageKey={`ivx-code-${data.id}`}
          onChange={setCode}
          onRun={setLastRun}
        />
      ) : (
        <Whiteboard storageKey={`ivx-board-${data.id}`} onSummary={setDiagram} />
      )}
    </section>
  ) : null;

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <header className="relative shrink-0 border-b border-outline-variant bg-surface-container-low">
        <div className="flex h-16 items-center gap-2 px-2 sm:gap-3 sm:px-4">
          <Button asChild variant="ghost" size="icon" aria-label="Leave the room (your interview is saved)">
            <Link href="/dashboard">
              <X />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-title-md">{data.title}</div>
            <div className="truncate text-body-sm text-on-surface-variant">
              {data.subtitle}
              {data.demo && " · offline demo interviewer"}
            </div>
          </div>
          <Badge variant="outline" className="hidden h-8 rounded-lg px-3 tabular-nums sm:inline-flex">
            Q{turns.length} / ~{data.maxQuestions}
          </Badge>
          <Badge
            variant={timeUp ? "destructive" : remaining < 120 ? "warning" : "outline"}
            className="h-8 rounded-lg px-3 tabular-nums"
            aria-label={`Time elapsed ${formatClock(elapsed)} of ${data.durationMinutes} minutes`}
          >
            <Clock /> {timeUp ? "Time's up" : `${formatClock(elapsed)} / ${data.durationMinutes}:00`}
          </Badge>
          {hasWorkspace && (
            <Button
              variant={whiteboardOpen ? "tonal" : "outline"}
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => setWhiteboardOpen((o) => !o)}
              aria-pressed={whiteboardOpen}
            >
              {data.problem ? <Code2 /> : <PenTool />} {workspaceLabel}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfirmEnd(true)} disabled={status !== "idle"} className="border-error/60 text-error">
            <Square className="size-3.5 fill-current" /> End
          </Button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent" aria-hidden>
          <div className={cn("h-full transition-[width] duration-1000", timeUp ? "bg-error" : "bg-primary")} style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      {hasWorkspace && (
        <div className="shrink-0 px-4 pt-3 lg:hidden">
          <SegmentedButton
            ariaLabel="Panel"
            value={pane}
            onChange={setPane}
            options={[
              { value: "chat", label: "Conversation", icon: <MessagesSquare /> },
              { value: "work", label: workspaceLabel, icon: data.problem ? <Code2 /> : <PenTool /> },
            ]}
          />
        </div>
      )}

      <div
        className={cn(
          "grid min-h-0 flex-1",
          hasWorkspace && whiteboardOpen && (data.problem ? "lg:grid-cols-[minmax(380px,1fr)_minmax(0,1.25fr)]" : "lg:grid-cols-[minmax(380px,1fr)_minmax(0,1.35fr)]"),
        )}
      >
        {conversation}
        {workspace}
      </div>

      <Dialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        icon={<Square />}
        title={answeredCount ? "End the interview?" : "Discard this interview?"}
        description={
          answeredCount
            ? `You've answered ${answeredCount} question${answeredCount === 1 ? "" : "s"}. Your report will be generated now.`
            : "You haven't answered any questions yet, so there's nothing to report. The interview will be discarded."
        }
        actions={
          <>
            <Button variant="text" onClick={() => setConfirmEnd(false)}>
              Keep going
            </Button>
            <Button
              variant={answeredCount ? "default" : "destructive"}
              onClick={() => {
                setConfirmEnd(false);
                void finish();
              }}
            >
              {answeredCount ? "End & get report" : "Discard"}
            </Button>
          </>
        }
      />
    </div>
  );
}

function InterviewerPresence({ label, speaking, thinking }: { label: string; speaking: boolean; thinking: boolean }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <span className="relative grid size-12 place-items-center">
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--tertiary))] transition-transform duration-500",
            speaking && "animate-pulse",
          )}
        />
        <span className="relative flex h-5 items-end gap-0.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-white"
              style={{ height: speaking || thinking ? "100%" : `${[40, 70, 55, 35][i]}%`, animation: speaking || thinking ? `voice-bar ${thinking ? 1.2 : 0.8}s ${i * 0.12}s ease-in-out infinite` : undefined }}
            />
          ))}
        </span>
      </span>
      <div>
        <div className="text-title-sm">Interviewer</div>
        <div className="text-body-sm text-on-surface-variant">{thinking ? "Thinking…" : speaking ? "Speaking…" : label}</div>
      </div>
    </div>
  );
}

function ProblemCard({ problem }: { problem: PublicProblem }) {
  return (
    <details open className="group rounded-3xl border border-outline-variant bg-card">
      <summary className="flex list-none items-center justify-between gap-3 px-5 py-4">
        <span className="flex items-center gap-2 text-title-md">
          <Code2 className="size-5 text-primary" /> {problem.title}
        </span>
        <Badge variant={problem.difficulty === "hard" ? "destructive" : problem.difficulty === "medium" ? "warning" : "success"} className="capitalize">
          {problem.difficulty}
        </Badge>
      </summary>
      <div className="space-y-3 border-t border-outline-variant px-5 py-4 text-body-md">
        <p className="leading-relaxed">{renderInlineCode(problem.statement)}</p>
        {problem.examples.map((ex, i) => (
          <div key={i} className="rounded-2xl bg-surface-container-low px-4 py-3 font-mono text-body-sm">
            <div>
              <span className="text-on-surface-variant">Input: </span>
              {ex.input}
            </div>
            <div>
              <span className="text-on-surface-variant">Output: </span>
              {ex.output}
            </div>
            {ex.explanation && <div className="mt-1 font-sans text-on-surface-variant">{ex.explanation}</div>}
          </div>
        ))}
        <ul className="list-disc space-y-0.5 pl-5 text-body-sm text-on-surface-variant">
          {problem.constraints.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith("`") ? (
      <code key={i} className="rounded-md bg-surface-container px-1.5 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

function VoicePanel({
  available,
  listening,
  transcribing,
  serverMode,
  interim,
  error,
  disabled,
  onToggle,
}: {
  available: boolean;
  listening: boolean;
  transcribing: boolean;
  serverMode: boolean;
  interim: string;
  error: string | null;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-3 pt-3 pb-1 text-center">
      <button
        type="button"
        onClick={onToggle}
        disabled={!available || disabled || transcribing}
        aria-label={listening ? "Stop recording" : "Start recording"}
        className={cn(
          "state-layer grid size-16 place-items-center rounded-full shadow-elevation-2 transition-colors disabled:opacity-40",
          listening ? "animate-pulse-ring bg-error text-on-error" : "bg-primary text-on-primary",
        )}
      >
        {transcribing ? <Loader2 className="size-6 animate-spin" /> : listening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
      </button>
      <div className="text-body-sm text-on-surface-variant">
        {!available
          ? "Voice input isn't available in this browser — try Chrome or Edge, or type below."
          : transcribing
            ? "Transcribing…"
            : listening
              ? serverMode
                ? "Recording… tap to stop and transcribe."
                : "Listening… tap to pause. You can edit the transcript before sending."
              : "Tap the mic and answer out loud."}
      </div>
      {interim && <div className="text-body-md text-on-surface-variant italic">“{interim}”</div>}
      {error && <div className="text-body-sm text-error">{error}</div>}
    </div>
  );
}

function InterviewerBubble({ topic, children }: { topic?: string; children: React.ReactNode }) {
  return (
    <div className="mr-6 animate-rise-in sm:mr-16">
      {topic && <div className="mb-1 pl-1 text-label-md text-on-surface-variant">{topic}</div>}
      <div className="rounded-[20px] rounded-tl-md bg-surface-container-high px-4 py-3 text-body-lg leading-relaxed">{children}</div>
    </div>
  );
}

function CandidateBubble({ children, attachments }: { children: React.ReactNode; attachments?: string[] }) {
  return (
    <div className="ml-6 flex animate-rise-in flex-col items-end sm:ml-16">
      <div className="rounded-[20px] rounded-tr-md bg-primary px-4 py-3 text-body-lg leading-relaxed whitespace-pre-wrap text-on-primary">
        {children}
      </div>
      {attachments && attachments.length > 0 && (
        <div className="mt-1.5 flex gap-1.5">
          {attachments.map((a) => (
            <span key={a} className="rounded-lg bg-secondary-container px-2 py-0.5 text-label-md text-on-secondary-container">
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
