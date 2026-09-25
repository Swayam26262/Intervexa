"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, FileSearch, Keyboard, Loader2, Mic, Target, Wand2 } from "lucide-react";
import { TypeIcon } from "@/components/interview-meta";
import { JdMatchView } from "@/components/jd-match";
import { ProBadge, ProDialog } from "@/components/pro-dialog";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedButton } from "@/components/ui/segmented";
import { NativeSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import type { Feature } from "@/lib/billing/plans";
import {
  DIFFICULTIES,
  DIFFICULTY_META,
  DURATIONS,
  INTERVIEW_TYPES,
  LANGUAGE_CODES,
  LANGUAGES,
  PERSONALITIES,
  PERSONALITY_META,
  TYPE_META,
  type AnswerMode,
  type Difficulty,
  type InterviewType,
  type Language,
  type Personality,
} from "@/lib/interview/config";
import type { CodeLanguage, JdAnalysis } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

export interface SetupDefaults {
  type: InterviewType;
  role: string;
  experienceYears: number;
  difficulty: Difficulty;
  showJd: boolean;
  focus: string;
  drill: boolean;
  packId: string;
  hasResume: boolean;
  aiConfigured: boolean;
  features: Record<Feature, boolean>;
  packs: { id: string; label: string; blurb: string; personality: Personality }[];
  packDisclaimer: string;
  problems: { id: string; title: string; difficulty: Difficulty }[];
}

export function SetupForm({ defaults }: { defaults: SetupDefaults }) {
  const router = useRouter();
  const f = defaults.features;
  const [type, setType] = useState<InterviewType>(defaults.type);
  const [role, setRole] = useState(defaults.role);
  const [experienceYears, setExperienceYears] = useState(defaults.experienceYears);
  const [difficulty, setDifficulty] = useState<Difficulty>(defaults.difficulty);
  const [drill, setDrill] = useState(defaults.drill && f.drills);
  const [durationMinutes, setDuration] = useState<number>(defaults.drill ? 10 : 30);
  const [personality, setPersonality] = useState<Personality>("professional");
  const [packId, setPackId] = useState(f.packs ? defaults.packId : "");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("text");
  const [language, setLanguage] = useState<Language>("en");
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>("javascript");
  const [problemId, setProblemId] = useState("");
  const [useResume, setUseResume] = useState(defaults.hasResume);
  const [showJd, setShowJd] = useState(defaults.showJd && f.jd);
  const [jobDescription, setJobDescription] = useState("");
  const [jdAnalysis, setJdAnalysis] = useState<JdAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [focus, setFocus] = useState(defaults.focus);
  const [pending, setPending] = useState(false);
  const [upsell, setUpsell] = useState<string | null>(null);

  const gate = (feature: Feature, message: string, fn: () => void) => () => (f[feature] ? fn() : setUpsell(message));
  const problems = useMemo(() => defaults.problems.filter((p) => p.difficulty === difficulty), [defaults.problems, difficulty]);

  async function analyzeJd() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/jd/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Couldn't analyse the job description.");
      setJdAnalysis(data.analysis);
      if (!role.trim() && data.analysis.title) setRole(data.analysis.title);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't analyse the job description.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (drill && !focus.trim()) {
      toast.error("Choose what the drill should focus on.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          experienceYears,
          type: drill ? (type === "coding" ? "technical" : type) : type,
          difficulty,
          durationMinutes: drill ? 10 : durationMinutes,
          personality,
          answerMode,
          useResume,
          language,
          drill: drill || undefined,
          packId: packId || undefined,
          jobDescription: showJd && jobDescription.trim() ? jobDescription : undefined,
          jdAnalysis: showJd && jdAnalysis ? jdAnalysis : undefined,
          focus: focus || undefined,
          ...(type === "coding" && !drill ? { codeLanguage, problemId: problemId || undefined } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 402) {
        setUpsell(data?.error ?? "This option is part of Pro.");
        setPending(false);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Could not start the interview.");
      router.push(`/interview/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the interview.");
      setPending(false);
    }
  }

  const summary = [
    drill ? `Drill · ${focus || "choose a focus"}` : TYPE_META[type].label,
    `${drill ? 10 : durationMinutes} min`,
    DIFFICULTY_META[difficulty].label,
    packId ? defaults.packs.find((p) => p.id === packId)?.label : PERSONALITY_META[personality].label,
    answerMode === "voice" ? "Voice" : "Text",
    language !== "en" ? LANGUAGES[language].label : null,
  ].filter(Boolean);

  return (
    <form onSubmit={start} className="space-y-5 pb-28">
      <Section
        title="Practice drill"
        icon={<Target />}
        aside={
          <div className="flex items-center gap-3">
            {!f.drills && <ProBadge />}
            <Switch
              checked={drill}
              aria-label="Practice drill mode"
              onCheckedChange={(v) => (f.drills ? setDrill(v) : setUpsell("Practice drills are part of Pro."))}
            />
          </div>
        }
        description="A focused 10-minute session on one topic: fundamentals first, then harder. Great for weak spots."
      >
        {drill && (
          <div className="mt-4">
            <Label htmlFor="focus-drill" className="mb-2">
              Drill focus
            </Label>
            <Input id="focus-drill" value={focus} maxLength={200} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Database indexing, React re-renders, STAR stories" />
          </div>
        )}
      </Section>

      {!drill && (
        <Section title="Round" description="What kind of interview do you want to practise?">
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTERVIEW_TYPES.map((t) => {
              const locked = t === "coding" && !f.coding;
              return (
                <Choice
                  key={t}
                  selected={type === t}
                  onClick={locked ? () => setUpsell("Coding rounds are part of Pro.") : () => setType(t)}
                >
                  <div className="flex items-start gap-3">
                    <TypeIcon type={t} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-title-sm">
                        {TYPE_META[t].label} {locked && <ProBadge />}
                      </div>
                      <div className="mt-0.5 text-body-sm text-on-surface-variant">{TYPE_META[t].blurb}</div>
                    </div>
                  </div>
                </Choice>
              );
            })}
          </div>
          {type === "project_deep_dive" && !defaults.hasResume && (
            <p className="mt-3 text-body-sm text-on-surface-variant">Tip: upload a resume in your profile so the interviewer can drill into your real projects.</p>
          )}
          {type === "coding" && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2">Language</Label>
                <SegmentedButton
                  ariaLabel="Coding language"
                  value={codeLanguage}
                  onChange={setCodeLanguage}
                  options={[
                    { value: "javascript", label: "JavaScript" },
                    { value: "python", label: "Python" },
                  ]}
                />
              </div>
              <div>
                <Label htmlFor="problem" className="mb-2">
                  Problem
                </Label>
                <NativeSelect id="problem" value={problemId} onChange={(e) => setProblemId(e.target.value)} className="h-10">
                  <option value="">Surprise me ({DIFFICULTY_META[difficulty].label.toLowerCase()})</option>
                  {problems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          )}
        </Section>
      )}

      <Section title="Role & level">
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="role" className="mb-2">
              Role
            </Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required minLength={2} placeholder="e.g. AI Engineer" />
          </div>
          <div>
            <Label htmlFor="exp" className="mb-2">
              Experience (years)
            </Label>
            <Input id="exp" type="number" min={0} max={50} step={0.5} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-2">Difficulty</Label>
            <SegmentedButton ariaLabel="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))} />
          </div>
          {!drill && (
            <div>
              <Label className="mb-2">Duration</Label>
              <SegmentedButton
                ariaLabel="Duration"
                value={String(durationMinutes)}
                onChange={(v) => setDuration(Number(v))}
                options={DURATIONS.filter((d) => d !== 10).map((d) => ({ value: String(d), label: `${d} min` }))}
              />
            </div>
          )}
        </div>
      </Section>

      <Section title="Interviewer" description="Style shapes tone and how hard the follow-ups push.">
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PERSONALITIES.map((p) => (
            <Choice key={p} selected={personality === p && !packId} onClick={() => { setPersonality(p); setPackId(""); }} compact>
              <div className="text-title-sm">{PERSONALITY_META[p].label}</div>
              <div className="mt-0.5 text-body-sm text-on-surface-variant">{PERSONALITY_META[p].blurb}</div>
            </Choice>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-label-lg">Company-style packs {!f.packs && <ProBadge />}</div>
          <div className="flex flex-wrap gap-2">
            {defaults.packs.map((p) => (
              <FilterChip
                key={p.id}
                selected={packId === p.id}
                title={p.blurb}
                onClick={gate("packs", "Company-style packs are part of Pro.", () => {
                  setPackId(packId === p.id ? "" : p.id);
                  setPersonality(p.personality);
                })}
              >
                {p.label}
              </FilterChip>
            ))}
          </div>
          <p className="mt-2 text-body-sm text-on-surface-variant">{defaults.packDisclaimer}</p>
        </div>
      </Section>

      <Section title="Answering">
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Choice selected={answerMode === "voice"} onClick={gate("voice", "Voice interviews are part of Pro.", () => setAnswerMode("voice"))}>
            <div className="flex items-center gap-2 text-title-sm">
              <Mic className="size-4.5" /> Voice {!f.voice && <ProBadge />}
            </div>
            <div className="mt-0.5 text-body-sm text-on-surface-variant">Speak your answers and hear the questions — closest to the real thing.</div>
          </Choice>
          <Choice selected={answerMode === "text"} onClick={() => setAnswerMode("text")}>
            <div className="flex items-center gap-2 text-title-sm">
              <Keyboard className="size-4.5" /> Text
            </div>
            <div className="mt-0.5 text-body-sm text-on-surface-variant">Type your answers. You can switch to voice at any time.</div>
          </Choice>
        </div>
        <div className="mt-5 max-w-sm">
          <Label htmlFor="language" className="mb-2">
            Interview language {!f.languages && <ProBadge />}
          </Label>
          <NativeSelect
            id="language"
            value={language}
            onChange={(e) => {
              const v = e.target.value as Language;
              if (v !== "en" && !f.languages) setUpsell("Interviews in Indian languages are part of Pro.");
              else setLanguage(v);
            }}
          >
            {LANGUAGE_CODES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGES[l].label}
              </option>
            ))}
          </NativeSelect>
          {language !== "en" && !defaults.aiConfigured && (
            <p className="mt-1.5 text-body-sm text-on-surface-variant">The offline demo interviewer speaks English only — add an AI key for other languages.</p>
          )}
        </div>
      </Section>

      <Section title="Context" icon={<FileSearch />}>
        <div className="mt-4 space-y-5">
          <SwitchRow
            label="Use my resume"
            description={defaults.hasResume ? "Ask about my projects and verify my resume claims." : "Upload a resume in your profile to enable this."}
            checked={useResume}
            disabled={!defaults.hasResume}
            onChange={setUseResume}
          />
          <SwitchRow
            label="Tailor to a job description"
            description="Paste the JD: we check your skill match and target its requirements."
            checked={showJd}
            onChange={(v) => (f.jd ? setShowJd(v) : setUpsell("Job-description tailoring is part of Pro."))}
            badge={!f.jd ? <ProBadge /> : undefined}
          />
          {showJd && (
            <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
              <Textarea
                aria-label="Job description"
                rows={7}
                maxLength={12000}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setJdAnalysis(null);
                }}
                placeholder={"We are looking for an AI Engineer with experience in:\n• Python, RAG, LangChain\n• AWS, vector databases…"}
                className="bg-card"
              />
              <div className="flex justify-end">
                <Button type="button" variant="tonal" onClick={() => void analyzeJd()} disabled={analyzing || jobDescription.trim().length < 40}>
                  {analyzing ? <Loader2 className="animate-spin" /> : <Wand2 />} Check my match
                </Button>
              </div>
              {jdAnalysis && (
                <div className="rounded-2xl bg-card p-4">
                  <JdMatchView analysis={jdAnalysis} />
                </div>
              )}
            </div>
          )}
          {!drill && (
            <div>
              <Label htmlFor="focus" className="mb-2">
                Anything specific to practise? <span className="font-normal text-on-surface-variant">(optional)</span>
              </Label>
              <Input id="focus" value={focus} maxLength={200} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Database indexing, system design trade-offs" />
            </div>
          )}
        </div>
      </Section>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-20 z-30 px-4 md:bottom-4 md:pl-24">
        <div className="mx-auto flex max-w-4xl items-center gap-4 rounded-2xl bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-elevation-3 sm:px-5">
          <div className="hidden min-w-0 flex-1 truncate text-body-md sm:block">{summary.join(" · ")}</div>
          <Button type="submit" size="lg" disabled={pending} className="ml-auto bg-inverse-primary text-on-primary-container">
            {pending ? <Loader2 className="animate-spin" /> : null}
            {pending ? "Preparing your interviewer…" : drill ? "Start drill" : "Start interview"}
            {!pending && <ArrowRight />}
          </Button>
        </div>
      </div>

      <ProDialog open={upsell !== null} onOpenChange={(o) => !o && setUpsell(null)} message={upsell ?? ""} />
    </form>
  );
}

function Section({
  title,
  description,
  icon,
  aside,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-outline-variant bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-title-lg [&_svg]:size-5 [&_svg]:text-primary">
            {icon} {title}
          </h2>
          {description && <p className="mt-0.5 text-body-md text-on-surface-variant">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Choice({ selected, onClick, children, compact }: { selected: boolean; onClick: () => void; children: React.ReactNode; compact?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "state-layer rounded-2xl border text-left transition-colors duration-150",
        compact ? "p-3.5" : "p-4",
        selected ? "border-primary bg-secondary-container/60 shadow-[inset_0_0_0_1px_var(--primary)]" : "border-outline-variant",
      )}
    >
      {children}
    </button>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className={cn("flex items-center justify-between gap-4", disabled && "opacity-60")}>
      <div>
        <div id={id} className="flex items-center gap-2 text-title-sm">
          {label} {badge}
        </div>
        <div className="text-body-sm text-on-surface-variant">{description}</div>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
