"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Keyboard, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DIFFICULTIES,
  DIFFICULTY_META,
  DURATIONS,
  INTERVIEW_TYPES,
  PERSONALITIES,
  PERSONALITY_META,
  TYPE_META,
  type AnswerMode,
  type Difficulty,
  type InterviewType,
  type Personality,
} from "@/lib/interview/config";
import { cn } from "@/lib/utils";

export interface SetupDefaults {
  type: InterviewType;
  role: string;
  experienceYears: number;
  difficulty: Difficulty;
  showJd: boolean;
  focus: string;
  hasResume: boolean;
}

export function SetupForm({ defaults }: { defaults: SetupDefaults }) {
  const router = useRouter();
  const [type, setType] = useState<InterviewType>(defaults.type);
  const [role, setRole] = useState(defaults.role);
  const [experienceYears, setExperienceYears] = useState(defaults.experienceYears);
  const [difficulty, setDifficulty] = useState<Difficulty>(defaults.difficulty);
  const [durationMinutes, setDuration] = useState<number>(30);
  const [personality, setPersonality] = useState<Personality>("professional");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("text");
  const [useResume, setUseResume] = useState(defaults.hasResume);
  const [showJd, setShowJd] = useState(defaults.showJd);
  const [jobDescription, setJobDescription] = useState("");
  const [focus, setFocus] = useState(defaults.focus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          experienceYears,
          type,
          difficulty,
          durationMinutes,
          personality,
          answerMode,
          useResume,
          jobDescription: showJd ? jobDescription : undefined,
          focus: focus || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not start the interview.");
      router.push(`/interview/${data.id}?mode=${answerMode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the interview.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={start} className="space-y-8">
      <Section title="Interview type">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {INTERVIEW_TYPES.map((t) => (
            <Choice key={t} selected={type === t} onClick={() => setType(t)}>
              <div className="text-xl">{TYPE_META[t].emoji}</div>
              <div className="mt-1 text-sm font-medium">{TYPE_META[t].label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{TYPE_META[t].blurb}</div>
            </Choice>
          ))}
        </div>
        {type === "project_deep_dive" && !defaults.hasResume && (
          <p className="mt-2 text-xs text-warning">Tip: upload your resume in your profile so Intervexa can drill into your actual projects.</p>
        )}
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="role" className="mb-2">Role</Label>
          <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required minLength={2} placeholder="e.g. AI Engineer" />
        </div>
        <div>
          <Label htmlFor="exp" className="mb-2">Experience (years)</Label>
          <Input id="exp" type="number" min={0} max={50} step={0.5} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Section title="Difficulty">
          <Segmented
            options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))}
            value={difficulty}
            onChange={(v) => setDifficulty(v as Difficulty)}
          />
        </Section>
        <Section title="Duration">
          <Segmented
            options={DURATIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
            value={String(durationMinutes)}
            onChange={(v) => setDuration(Number(v))}
          />
        </Section>
      </div>

      <Section title="Interviewer">
        <div className="grid gap-3 sm:grid-cols-3">
          {PERSONALITIES.map((p) => (
            <Choice key={p} selected={personality === p} onClick={() => setPersonality(p)}>
              <div className="text-sm font-medium">{PERSONALITY_META[p].label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{PERSONALITY_META[p].blurb}</div>
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="How will you answer?">
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice selected={answerMode === "voice"} onClick={() => setAnswerMode("voice")}>
            <div className="flex items-center gap-2 text-sm font-medium"><Mic className="size-4" /> Voice</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Speak your answers, hear the questions. Best in Chrome or Edge.</div>
          </Choice>
          <Choice selected={answerMode === "text"} onClick={() => setAnswerMode("text")}>
            <div className="flex items-center gap-2 text-sm font-medium"><Keyboard className="size-4" /> Text</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Type your answers. You can switch to voice at any time.</div>
          </Choice>
        </div>
      </Section>

      <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
        <label className={cn("flex items-start gap-3", !defaults.hasResume && "opacity-60")}>
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--primary)]"
            checked={useResume}
            disabled={!defaults.hasResume}
            onChange={(e) => setUseResume(e.target.checked)}
          />
          <span className="text-sm">
            <span className="font-medium">Use my resume</span>
            <span className="block text-xs text-muted-foreground">
              {defaults.hasResume ? "Ask about my projects and verify my resume claims." : "Upload a resume in your profile to enable this."}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={showJd} onChange={(e) => setShowJd(e.target.checked)} />
          <span className="text-sm">
            <span className="font-medium">Tailor to a job description</span>
            <span className="block text-xs text-muted-foreground">Paste the JD and questions will target that exact job.</span>
          </span>
        </label>
        {showJd && (
          <Textarea
            aria-label="Job description"
            rows={6}
            maxLength={12000}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder={"We are looking for an AI Engineer with experience in:\n• Python, RAG, LangChain\n• AWS, vector databases…"}
          />
        )}

        <div>
          <Label htmlFor="focus" className="mb-2">Anything specific to practise? <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="focus" value={focus} maxLength={200} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Database indexing, system design trade-offs" />
        </div>
      </div>

      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Preparing your interviewer…" : "Start interview"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{title}</legend>
      {children}
    </fieldset>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-3.5 text-left transition hover:border-primary/50",
        selected && "border-primary bg-accent/50 ring-2 ring-primary/20",
      )}
    >
      {children}
    </button>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" className="inline-flex w-full rounded-lg border bg-muted/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition",
            value === o.value && "bg-card text-foreground shadow-sm",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
