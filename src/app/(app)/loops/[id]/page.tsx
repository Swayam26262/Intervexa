import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, CircleX, Clock, Info, Lightbulb } from "lucide-react";
import { TypeIcon } from "@/components/interview-meta";
import { JdMatchView } from "@/components/jd-match";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { getEntitlements } from "@/lib/billing/service";
import { TYPE_META } from "@/lib/interview/config";
import { getPack } from "@/lib/interview/packs";
import { getLoop } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, scoreTone } from "@/lib/utils";
import { StartRound } from "./start-round";

export const metadata: Metadata = { title: "Mock loop" };

const LEVEL = {
  strong: { label: "Strong", icon: CheckCircle2, className: "text-success" },
  moderate: { label: "Moderate", icon: CircleAlert, className: "text-warning" },
  weak: { label: "Needs work", icon: CircleX, className: "text-error" },
} as const;

export default async function LoopPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [loop, entitlements] = await Promise.all([getLoop(userId, id), getEntitlements(userId)]);
  if (!loop) notFound();
  const pack = getPack(loop.packId);
  const nextIndex = loop.rounds.findIndex((r) => r.status !== "completed");
  const done = loop.rounds.filter((r) => r.status === "completed").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={pack ? `${pack.label} loop` : "Mock loop"}
        title={loop.title}
        description={`${done} of ${loop.rounds.length} rounds complete.`}
        actions={
          <Button asChild variant="outline">
            <Link href="/loops">All loops</Link>
          </Button>
        }
      />

      {loop.readiness && (
        <section className="rounded-[28px] bg-tertiary-container p-6 text-on-tertiary-container sm:p-8" aria-labelledby="ready-heading">
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing value={loop.readiness.overall} size={120} stroke={12} indicatorClassName="stroke-tertiary">
              <div className="text-center">
                <div className="text-headline-lg">{loop.readiness.overall}%</div>
                <div className="text-label-sm opacity-80">prepared</div>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <h2 id="ready-heading" className="text-headline-sm">
                Job readiness report
              </h2>
              <p className="mt-2 text-body-lg">{loop.readiness.summary}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-surface-container-lowest/70 p-5 text-on-surface">
              <h3 className="mb-3 text-title-sm">Skills for this job</h3>
              <ul className="space-y-2">
                {loop.readiness.skills.map((s) => {
                  const l = LEVEL[s.level];
                  const Icon = l.icon;
                  return (
                    <li key={s.name} className="flex items-start gap-2.5 text-body-md" title={s.evidence}>
                      <Icon className={cn("mt-0.5 size-4.5 shrink-0", l.className)} aria-hidden />
                      <span>
                        <span className="font-medium">{s.name}</span> <span className="text-on-surface-variant">— {l.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest/70 p-5 text-on-surface">
              <h3 className="mb-3 text-title-sm">Next steps</h3>
              <ul className="space-y-2 text-body-md">
                {loop.readiness.nextSteps.map((s) => (
                  <li key={s} className="flex gap-2">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-body-sm opacity-80">
            <Info className="size-4" /> Practice readiness, not a prediction of any employer&apos;s decision.
          </p>
        </section>
      )}

      <section aria-labelledby="rounds-heading">
        <h2 id="rounds-heading" className="mb-3 text-title-lg">
          Rounds
        </h2>
        <ol className="relative space-y-3">
          {loop.rounds.map((round, i) => {
            const isNext = i === nextIndex;
            return (
              <li
                key={i}
                className={cn(
                  "flex flex-wrap items-center gap-4 rounded-[28px] border p-5",
                  isNext ? "border-primary bg-secondary-container/40" : "border-outline-variant bg-card",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full text-title-sm",
                    round.status === "completed" ? "bg-success-container text-on-success-container" : isNext ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant",
                  )}
                >
                  {round.status === "completed" ? <CheckCircle2 className="size-5" /> : i + 1}
                </span>
                <TypeIcon type={round.type} />
                <div className="min-w-0 flex-1">
                  <div className="text-title-md">{round.title}</div>
                  <div className="flex flex-wrap items-center gap-x-2 text-body-sm text-on-surface-variant">
                    <span>{TYPE_META[round.type].label}</span>·
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {round.durationMinutes} min
                    </span>
                    {round.focus && <>· <span className="truncate">{round.focus}</span></>}
                  </div>
                </div>
                {round.status === "completed" ? (
                  <div className="flex items-center gap-3">
                    <span className={cn("text-title-lg tabular-nums", scoreTone(round.score))}>{round.score ?? "—"}</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/interview/${round.interviewId}/report`}>Report</Link>
                    </Button>
                  </div>
                ) : round.status === "in_progress" || isNext ? (
                  <StartRound loopId={id} index={i} resume={round.status === "in_progress"} voice={entitlements.features.voice} />
                ) : (
                  <Badge variant="outline">Up next</Badge>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <details className="rounded-[28px] border border-outline-variant bg-card p-6" open={!loop.readiness}>
        <summary className="text-title-lg">Job match</summary>
        <div className="mt-4">
          <JdMatchView analysis={loop.jd} />
        </div>
      </details>
    </div>
  );
}
