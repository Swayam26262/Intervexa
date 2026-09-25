import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  CircleX,
  Code2,
  Info,
  Layers,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  ShieldQuestion,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { TypeIcon } from "@/components/interview-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { getEntitlements } from "@/lib/billing/service";
import { DIFFICULTY_META, TYPE_META } from "@/lib/interview/config";
import { CATEGORY_KEYS, CATEGORY_LABELS, type ClaimCheck, type InterviewReport } from "@/lib/interview/types";
import { getInterview } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, formatDate, scoreTone } from "@/lib/utils";
import { ReportPending } from "./report-pending";

export const metadata: Metadata = { title: "Interview report" };

const CLAIM_STATUS: Record<ClaimCheck["status"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  verified: { label: "Verified", icon: CheckCircle2, className: "text-success" },
  partial: { label: "Partly supported", icon: CircleAlert, className: "text-warning" },
  unverified: { label: "Not supported", icon: CircleX, className: "text-error" },
  not_discussed: { label: "Not discussed", icon: CircleDashed, className: "text-on-surface-variant" },
};

function ringTone(score: number) {
  return score >= 75 ? "stroke-success" : score >= 55 ? "stroke-warning" : "stroke-error";
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [interview, entitlements] = await Promise.all([getInterview(userId, id), getEntitlements(userId)]);
  if (!interview) notFound();
  if (interview.status !== "completed") redirect(`/interview/${id}`);
  if (!interview.report || interview.reportStatus === "pending" || interview.reportStatus === "failed") {
    return (
      <div className="mx-auto max-w-4xl pt-6">
        <ReportPending id={id} initialStatus={interview.reportStatus === "failed" ? "failed" : "pending"} />
      </div>
    );
  }

  const { report, config } = interview;
  // Credit/Pro interviews always get the full report; free ones get the core report when billing is on.
  const full = entitlements.features.fullReport || interview.billing !== "free";
  const turnsByIndex = new Map(interview.turns.map((t) => [t.index, t]));
  const practiceFocus = report.weakTopics[0] ?? report.suggestedTopics[0];
  const retake = `/interview/new?type=${config.type}${config.drill ? `&drill=1&focus=${encodeURIComponent(config.focus ?? "")}` : ""}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <TypeIcon type={config.type} size="lg" />
          <div>
            <p className="text-label-lg text-on-surface-variant">
              {TYPE_META[config.type].label} · {DIFFICULTY_META[config.difficulty].label} · {formatDate(interview.endedAt ?? interview.createdAt)}
            </p>
            <h1 className="text-headline-md">{config.drill ? `Drill: ${config.focus}` : `${config.role} report`}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={retake}>
              <RotateCcw /> Retake
            </Link>
          </Button>
          {practiceFocus && (
            <Button asChild>
              <Link href={`/interview/new?type=technical&drill=1&focus=${encodeURIComponent(practiceFocus)}`}>
                <Target /> Drill {practiceFocus}
              </Link>
            </Button>
          )}
        </div>
      </header>

      {config.loopId && (
        <Link
          href={`/loops/${config.loopId}`}
          className="state-layer flex items-center gap-3 rounded-2xl bg-secondary-container px-5 py-3 text-on-secondary-container"
        >
          <Layers className="size-5" />
          <span className="flex-1 text-title-sm">Part of a mock loop — round {(config.roundIndex ?? 0) + 1}</span>
          <span className="text-label-lg">Back to loop</span> <ArrowRight className="size-4" />
        </Link>
      )}

      {/* Overview */}
      <section className="grid gap-6 rounded-[28px] border border-outline-variant bg-card p-6 md:grid-cols-[auto_1fr] md:p-8" aria-label="Overview">
        <div className="flex flex-col items-center justify-center gap-2">
          <ProgressRing value={report.overallScore} size={168} stroke={14} indicatorClassName={ringTone(report.overallScore)}>
            <div className="text-center">
              <div className="text-display-md">{report.overallScore}</div>
              <div className="text-label-md text-on-surface-variant">out of 100</div>
            </div>
          </ProgressRing>
        </div>
        <div className="space-y-6">
          <p className="text-body-lg leading-relaxed">{report.summary}</p>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {CATEGORY_KEYS.map((key) => {
              const value = report.categoryScores[key];
              return (
                <div key={key}>
                  <div className="mb-1.5 flex justify-between text-body-md">
                    <span>{CATEGORY_LABELS[key]}</span>
                    <span className={cn("font-semibold tabular-nums", scoreTone(value))}>{value ?? "—"}</span>
                  </div>
                  {value === null ? (
                    <div className="text-body-sm text-on-surface-variant">Not assessed in this round</div>
                  ) : (
                    <Progress value={value} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {report.improvement && report.improvement.length > 0 && (
        <section className="rounded-[28px] bg-tertiary-container p-6 text-on-tertiary-container" aria-labelledby="improve-heading">
          <h2 id="improve-heading" className="flex items-center gap-2 text-title-lg">
            <Sparkles className="size-5" /> Intervexa checked your weak spots
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.improvement.map((imp) => {
              const up = imp.after >= imp.before;
              const Icon = up ? TrendingUp : TrendingDown;
              return (
                <li key={imp.topic} className="rounded-2xl bg-surface-container-lowest/70 p-4 text-on-surface">
                  <div className="text-title-sm">{imp.topic}</div>
                  <div className="mt-1 flex items-center gap-2 text-body-md">
                    <span className="text-on-surface-variant tabular-nums">{imp.before}</span>
                    <ArrowRight className="size-4 text-on-surface-variant" />
                    <span className="font-semibold tabular-nums">{imp.after}</span>
                    <span className={cn("ml-auto flex items-center gap-1 text-label-lg", up ? "text-success" : "text-error")}>
                      <Icon className="size-4" /> {up ? "Improved" : "Dipped"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ListCard icon={<CheckCircle2 className="text-success" />} title="Strengths" items={report.strengths} />
        <ListCard icon={<XCircle className="text-error" />} title="To improve" items={report.weaknesses} />
        <ChipCard icon={<CircleAlert className="text-warning" />} title="Topics you missed" items={report.missedTopics} />
        <ChipCard icon={<Lightbulb className="text-primary" />} title="Practise next" items={report.suggestedTopics} drill />
      </div>

      {report.coding && <CodingReview coding={report.coding} />}
      {report.claims &&
        report.claims.length > 0 &&
        (config.type === "project_deep_dive" || report.claims.some((c) => c.status !== "not_discussed")) && <Claims claims={report.claims} />}

      {full ? <Communication report={report} /> : <Upsell />}

      <section className="space-y-3" aria-labelledby="answers-heading">
        <h2 id="answers-heading" className="text-title-lg">
          Answer-by-answer
        </h2>
        {report.questions.map((q) => {
          const turn = turnsByIndex.get(q.turnIndex);
          if (!turn) return null;
          return (
            <details key={q.turnIndex} className="group overflow-hidden rounded-3xl border border-outline-variant bg-card open:shadow-elevation-1">
              <summary className="state-layer flex list-none items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="text-label-md text-on-surface-variant">
                    Q{turn.index} · {turn.topic}
                  </div>
                  <div className="mt-1 text-title-sm">{turn.question}</div>
                </div>
                <span className={cn("shrink-0 text-title-lg tabular-nums", scoreTone(q.score * 10))}>
                  {q.score}
                  <span className="text-body-sm text-on-surface-variant">/10</span>
                </span>
              </summary>
              <div className="space-y-4 border-t border-outline-variant p-5">
                <div>
                  <div className="mb-1.5 text-label-md text-on-surface-variant">Your answer</div>
                  <p className="rounded-2xl bg-surface-container-low p-4 text-body-md whitespace-pre-wrap">{turn.answer}</p>
                  {turn.code && (
                    <pre className="mt-2 max-h-72 overflow-auto rounded-2xl bg-surface-container-low p-4 font-mono text-body-sm">{turn.code.source}</pre>
                  )}
                  {turn.diagram?.summary && <p className="mt-2 rounded-2xl bg-surface-container-low p-4 text-body-sm text-on-surface-variant">Whiteboard: {turn.diagram.summary}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <MiniList title="What you did well" items={q.didWell} empty="—" />
                  <MiniList title="What was missing" items={q.missing} empty="Nothing major." />
                </div>
                {full && q.betterAnswer && (
                  <div className="rounded-2xl bg-primary-container p-4 text-on-primary-container">
                    <div className="mb-1 flex items-center gap-1.5 text-label-lg">
                      <Lightbulb className="size-4" /> A stronger answer
                    </div>
                    <p className="text-body-md leading-relaxed">{q.betterAnswer}</p>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </section>

      <p className="flex items-center justify-center gap-1.5 pb-4 text-center text-body-sm text-on-surface-variant">
        <Info className="size-4" /> Practice feedback, not a prediction of whether an employer will hire you.
        {interview.aiMode === "demo" && " Generated by the offline demo interviewer."}
      </p>
    </div>
  );
}

function ListCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <section className="rounded-[28px] border border-outline-variant bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 text-title-md [&_svg]:size-5">
        {icon} {title}
      </h2>
      {items.length ? (
        <ul className="space-y-2 text-body-md">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-on-surface-variant" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-md text-on-surface-variant">Nothing to note.</p>
      )}
    </section>
  );
}

function ChipCard({ icon, title, items, drill }: { icon: React.ReactNode; title: string; items: string[]; drill?: boolean }) {
  return (
    <section className="rounded-[28px] border border-outline-variant bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 text-title-md [&_svg]:size-5">
        {icon} {title}
      </h2>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) =>
            drill ? (
              <Link
                key={item}
                href={`/interview/new?type=technical&drill=1&focus=${encodeURIComponent(item)}`}
                className="state-layer inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant px-3 text-label-lg"
              >
                {item} <ArrowRight className="size-3.5 text-primary" />
              </Link>
            ) : (
              <span key={item} className="inline-flex h-8 items-center rounded-lg bg-surface-container px-3 text-label-lg">
                {item}
              </span>
            ),
          )}
        </div>
      ) : (
        <p className="text-body-md text-on-surface-variant">Nothing to note.</p>
      )}
    </section>
  );
}

function MiniList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <div className="mb-1.5 text-label-md text-on-surface-variant">{title}</div>
      {items.length ? (
        <ul className="list-disc space-y-1 pl-5 text-body-md">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        <p className="text-body-md text-on-surface-variant">{empty}</p>
      )}
    </div>
  );
}

function CodingReview({ coding }: { coding: NonNullable<InterviewReport["coding"]> }) {
  const rows = [
    ["Correctness", coding.correctness],
    ["Complexity", coding.complexity],
    ["Edge cases", coding.edgeCases],
    ["Code quality", coding.codeQuality],
    ["Explanation", coding.explanation],
  ] as const;
  return (
    <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="code-heading">
      <h2 id="code-heading" className="flex items-center gap-2 text-title-lg">
        <Code2 className="size-5 text-primary" /> Code review
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <BarList max={10} valueFormat={(v) => `${v}/10`} items={rows.map(([label, value]) => ({ key: label, label, value }))} />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <div className="text-label-md text-on-surface-variant">Time</div>
              <div className="mt-1 font-mono text-title-md">{coding.timeComplexity}</div>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <div className="text-label-md text-on-surface-variant">Space</div>
              <div className="mt-1 font-mono text-title-md">{coding.spaceComplexity}</div>
            </div>
          </div>
          <ul className="space-y-2 text-body-md">
            {coding.notes.map((n) => (
              <li key={n} className="flex gap-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" /> {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Claims({ claims }: { claims: ClaimCheck[] }) {
  return (
    <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="claims-heading">
      <h2 id="claims-heading" className="flex items-center gap-2 text-title-lg">
        <ShieldQuestion className="size-5 text-primary" /> Resume claims under questioning
      </h2>
      <ul className="mt-4 space-y-3">
        {claims.map((c) => {
          const s = CLAIM_STATUS[c.status];
          const Icon = s.icon;
          return (
            <li key={c.claim} className="rounded-2xl bg-surface-container-low p-4">
              <div className="flex items-start gap-3">
                <Icon className={cn("mt-0.5 size-5 shrink-0", s.className)} aria-hidden />
                <div className="min-w-0">
                  <div className="text-body-lg">“{c.claim}”</div>
                  <div className="mt-1 text-body-sm">
                    <span className="font-semibold">{s.label}.</span> <span className="text-on-surface-variant">{c.note}</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Communication({ report }: { report: InterviewReport }) {
  const c = report.communication;
  const fillers = Object.entries(c.fillerWords).sort((a, b) => b[1] - a[1]);
  const tiles = [
    {
      label: "Avg. answer length",
      value: `${c.avgWordsPerAnswer} words`,
      hint: c.avgWordsPerAnswer < 40 ? "Expand with reasoning and an example." : c.avgWordsPerAnswer > 200 ? "Aim for tighter, structured answers." : "A good length.",
    },
    {
      label: "Speaking pace",
      value: c.wordsPerMinute ? `${c.wordsPerMinute} wpm` : "—",
      hint: c.wordsPerMinute ? (c.wordsPerMinute > 170 ? "A bit fast — pause between points." : c.wordsPerMinute < 100 ? "A little slow — keep momentum." : "Comfortable pace.") : "Answer by voice to measure pace.",
    },
    { label: "Filler words", value: `${c.fillerPer100Words} / 100 words`, hint: c.fillerPer100Words > 3 ? "Replace fillers with a short pause." : "Nicely controlled." },
    {
      label: "Long pauses",
      value: c.pauses !== undefined && c.wordsPerMinute ? String(c.pauses) : "—",
      hint: c.longestPauseSec ? `Longest ${c.longestPauseSec}s. Short pauses are fine; long ones read as uncertainty.` : "Measured in voice answers.",
    },
  ];
  return (
    <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="comm-heading">
      <h2 id="comm-heading" className="flex items-center gap-2 text-title-lg">
        <MessageSquareText className="size-5 text-primary" /> Communication
      </h2>
      <p className="mt-1 text-body-md text-on-surface-variant">Coaching, not judgment — small habits make a big difference.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-surface-container-low p-4">
            <div className="text-label-md text-on-surface-variant">{t.label}</div>
            <div className="mt-1 text-title-lg">{t.value}</div>
            <div className="mt-1 text-body-sm text-on-surface-variant">{t.hint}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-title-sm">Filler words</h3>
          {fillers.length ? (
            <div className="flex flex-wrap gap-2">
              {fillers.map(([w, n]) => (
                <Badge key={w} variant="outline" className="h-7 text-label-lg">
                  “{w}” × {n}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-body-md text-on-surface-variant">None detected 🎉</p>
          )}
          {c.repeatedPhrases && c.repeatedPhrases.length > 0 && (
            <>
              <h3 className="mt-5 mb-2 text-title-sm">Repeated phrases</h3>
              <ul className="space-y-1 text-body-md">
                {c.repeatedPhrases.map((p) => (
                  <li key={p.phrase}>
                    “{p.phrase}” <span className="text-on-surface-variant">× {p.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div>
          {c.star ? (
            <>
              <h3 className="mb-1 text-title-sm">STAR structure</h3>
              <p className="mb-3 text-body-sm text-on-surface-variant">Share of your stories that covered each part.</p>
              <BarList
                valueFormat={(v) => `${v}%`}
                items={(
                  [
                    ["Situation", c.star.situation],
                    ["Task", c.star.task],
                    ["Action", c.star.action],
                    ["Result", c.star.result],
                  ] as const
                ).map(([label, v]) => ({ key: label, label, value: Math.round(v * 100) }))}
              />
            </>
          ) : c.paceByAnswer && c.paceByAnswer.length > 1 ? (
            <>
              <h3 className="mb-3 text-title-sm">Pace by answer (words per minute)</h3>
              <BarList max={220} items={c.paceByAnswer.map((p) => ({ key: String(p.turnIndex), label: `Q${p.turnIndex}`, value: p.wpm }))} />
            </>
          ) : (
            <>
              <h3 className="mb-1 text-title-sm">Structure</h3>
              <p className="text-body-md text-on-surface-variant">
                {c.signposting !== undefined && c.signposting > 0.4
                  ? "You signposted your longer answers well (first… then… finally)."
                  : "Try signposting longer answers: “There are two parts — first… second…”. It makes you easier to follow."}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Upsell() {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-[28px] bg-tertiary-container p-6 text-on-tertiary-container">
      <Sparkles className="size-6" />
      <div className="min-w-0 flex-1">
        <h2 className="text-title-md">Unlock the full report</h2>
        <p className="text-body-md opacity-85">Stronger-answer outlines, pace, pauses, STAR structure and repeated-phrase coaching come with Pro or interview credits.</p>
      </div>
      <Button asChild>
        <Link href="/billing">See plans</Link>
      </Button>
    </section>
  );
}
