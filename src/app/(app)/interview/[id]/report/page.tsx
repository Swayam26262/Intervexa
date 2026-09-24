import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Info, Lightbulb, MessageSquareText, Target, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DIFFICULTY_META, TYPE_META } from "@/lib/interview/config";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/interview/types";
import { getInterview } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, formatDate, scoreBarTone, scoreTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Interview report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const interview = await getInterview(userId, id);
  if (!interview) notFound();
  if (interview.status !== "completed" || !interview.report) redirect(`/interview/${id}`);

  const { report, config } = interview;
  const turnsByIndex = new Map(interview.turns.map((t) => [t.index, t]));
  const fillers = Object.entries(report.communication.fillerWords).sort((a, b) => b[1] - a[1]);
  const practiceFocus = report.weakTopics[0] ?? report.suggestedTopics[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {TYPE_META[config.type].label} · {DIFFICULTY_META[config.difficulty].label} · {formatDate(interview.endedAt ?? interview.createdAt)}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{config.role} — Interview report</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href={`/interview/new?type=${config.type}${practiceFocus ? `&focus=${encodeURIComponent(practiceFocus)}` : ""}`}>
              Practise weak areas
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-8 md:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center justify-center text-center">
            <ScoreRing score={report.overallScore} />
            <div className="mt-2 text-sm text-muted-foreground">Overall score</div>
          </div>
          <div className="space-y-3">
            {CATEGORY_KEYS.map((key) => {
              const value = report.categoryScores[key];
              return (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{CATEGORY_LABELS[key]}</span>
                    <span className={cn("font-semibold tabular-nums", scoreTone(value))}>{value ?? "—"}</span>
                  </div>
                  {value === null ? (
                    <div className="text-xs text-muted-foreground">Not assessed in this round</div>
                  ) : (
                    <Progress value={value} indicatorClassName={scoreBarTone(value)} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed">{report.summary}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <ListBlock icon={<CheckCircle2 className="size-4 text-success" />} title="Strengths" items={report.strengths} />
            <ListBlock icon={<XCircle className="size-4 text-destructive" />} title="Weaknesses" items={report.weaknesses} />
            <ListBlock icon={<Target className="size-4 text-warning" />} title="Topics you missed" items={report.missedTopics} chips />
            <ListBlock icon={<Lightbulb className="size-4 text-primary" />} title="Practise next" items={report.suggestedTopics} chips />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-primary" /> Communication
          </CardTitle>
          <CardDescription>Coaching, not judgment — small habits make a big difference in real interviews.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <Metric label="Avg. answer length" value={`${report.communication.avgWordsPerAnswer} words`} hint={report.communication.avgWordsPerAnswer < 40 ? "Try expanding with reasoning and an example." : report.communication.avgWordsPerAnswer > 200 ? "Aim for tighter, structured answers." : "A good length."} />
          <Metric
            label="Speaking pace"
            value={report.communication.wordsPerMinute ? `${report.communication.wordsPerMinute} wpm` : "—"}
            hint={report.communication.wordsPerMinute ? (report.communication.wordsPerMinute > 170 ? "A bit fast — pause between points." : report.communication.wordsPerMinute < 100 ? "A little slow — keep momentum." : "Comfortable pace.") : "Answer by voice to measure pace."}
          />
          <div>
            <div className="text-sm text-muted-foreground">Filler words</div>
            {fillers.length === 0 ? (
              <div className="mt-1 text-lg font-semibold text-success">None detected 🎉</div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {fillers.map(([word, n]) => (
                  <Badge key={word} variant="outline">
                    “{word}” × {n}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Answer-by-answer analysis</h2>
        {report.questions.map((q) => {
          const turn = turnsByIndex.get(q.turnIndex);
          if (!turn) return null;
          return (
            <details key={q.turnIndex} className="group rounded-xl border bg-card open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    Q{turn.index} · {turn.topic}
                  </div>
                  <div className="mt-0.5 font-medium">{turn.question}</div>
                </div>
                <span className={cn("shrink-0 text-lg font-semibold tabular-nums", scoreTone(q.score * 10))}>
                  {q.score}
                  <span className="text-xs font-normal text-muted-foreground">/10</span>
                </span>
              </summary>
              <div className="space-y-4 border-t px-4 py-4 text-sm">
                <div>
                  <div className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Your answer</div>
                  <p className="rounded-lg bg-muted/60 p-3 whitespace-pre-wrap">{turn.answer}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ListBlock icon={<CheckCircle2 className="size-4 text-success" />} title="What you did well" items={q.didWell} empty="—" />
                  <ListBlock icon={<XCircle className="size-4 text-destructive" />} title="What was missing" items={q.missing} empty="Nothing major." />
                </div>
                {q.betterAnswer && (
                  <div className="rounded-lg border border-primary/20 bg-accent/40 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
                      <Lightbulb className="size-3.5" /> A stronger answer
                    </div>
                    <p className="leading-relaxed">{q.betterAnswer}</p>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </section>

      <p className="flex items-center justify-center gap-1.5 pb-4 text-center text-xs text-muted-foreground">
        <Info className="size-3.5" /> This report is practice feedback, not a prediction of whether an employer will hire you.
        {interview.aiMode === "demo" && " Generated by the offline demo interviewer."}
      </p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className={cn(score >= 75 ? "stroke-success" : score >= 55 ? "stroke-warning" : "stroke-destructive")}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-4xl font-bold tabular-nums">{score}</div>
          <div className="text-xs text-muted-foreground">/ 100</div>
        </div>
      </div>
    </div>
  );
}

function ListBlock({
  icon,
  title,
  items,
  chips,
  empty = "Nothing to note.",
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  chips?: boolean;
  empty?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : chips ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="font-normal">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
