import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Repeat, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { ProBadge } from "@/components/pro-dialog";
import { Button } from "@/components/ui/button";
import { getEntitlements } from "@/lib/billing/service";
import { connectDB } from "@/lib/db";
import { Interview, type InterviewDoc } from "@/lib/models/interview";
import { getMemory } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, formatDate, scoreTone } from "@/lib/utils";
import { CustomDrill } from "./custom-drill";

export const metadata: Metadata = { title: "Practice" };

const POPULAR = [
  "JavaScript Fundamentals",
  "React",
  "Node.js & APIs",
  "Python",
  "Databases",
  "LLMs & RAG",
  "Cloud & Deployment",
  "Testing",
  "Debugging & Problem Solving",
  "System Design Basics",
  "STAR stories",
  "Tell me about yourself",
];

const drillHref = (focus: string) => `/interview/new?type=technical&drill=1&focus=${encodeURIComponent(focus)}`;

export default async function PracticePage() {
  const userId = await requireUserId();
  await connectDB();
  const [memory, entitlements, drills] = await Promise.all([
    getMemory(userId),
    getEntitlements(userId),
    Interview.find({ userId, "config.drill": true, status: "completed" })
      .sort({ createdAt: -1 })
      .limit(8)
      .select({ config: 1, createdAt: 1, "report.overallScore": 1, "report.improvement": 1 })
      .lean<InterviewDoc[]>(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Practice"
        description="Ten-minute drills that go from fundamentals to interview depth. Your next interview checks whether you improved."
        actions={!entitlements.features.drills ? <ProBadge /> : undefined}
      />

      <section aria-labelledby="rec-heading">
        <SectionTitle>
          <span id="rec-heading" className="flex items-center gap-2">
            <Repeat className="size-5 text-primary" /> Recommended for you
          </span>
        </SectionTitle>
        {memory.recurringWeakTopics.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memory.recurringWeakTopics.map((t, i) => (
              <Link
                key={t.topic}
                href={drillHref(t.topic)}
                className={cn(
                  "state-layer flex flex-col justify-between gap-6 rounded-[28px] p-5",
                  i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low",
                )}
              >
                <div>
                  <div className="text-label-lg opacity-80">{i === 0 ? "Top priority" : "Weak spot"}</div>
                  <div className="mt-1 text-title-lg">{t.topic}</div>
                  <div className="mt-1 text-body-md opacity-80">
                    Came up in {t.count} of your last {memory.interviewsConsidered} interviews
                  </div>
                </div>
                <span className="flex items-center gap-1 text-label-lg">
                  Start 10-minute drill <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-surface-container-low p-6 text-body-md text-on-surface-variant">
            Finish an interview and Intervexa will recommend drills for the topics you found hardest.
          </div>
        )}
      </section>

      <section aria-labelledby="topics-heading">
        <SectionTitle>
          <span id="topics-heading" className="flex items-center gap-2">
            <Target className="size-5 text-primary" /> Drill a topic
          </span>
        </SectionTitle>
        <div className="rounded-[28px] border border-outline-variant bg-card p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((topic) => (
              <Link key={topic} href={drillHref(topic)} className="state-layer inline-flex h-9 items-center rounded-lg border border-outline-variant px-3.5 text-label-lg">
                {topic}
              </Link>
            ))}
          </div>
          <div className="mt-5">
            <CustomDrill />
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-drills-heading">
        <SectionTitle>
          <span id="recent-drills-heading">Recent drills</span>
        </SectionTitle>
        {drills.length ? (
          <ul className="overflow-hidden rounded-[28px] border border-outline-variant bg-card">
            {drills.map((d, i) => {
              const imp = d.report?.improvement?.[0];
              return (
                <li key={String(d._id)} className={cn(i > 0 && "border-t border-outline-variant")}>
                  <Link href={`/interview/${d._id}/report`} className="state-layer flex items-center gap-4 px-5 py-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary-container text-on-secondary-container">
                      <Target className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-title-sm">{d.config.focus}</div>
                      <div className="text-body-sm text-on-surface-variant">{formatDate(d.createdAt)}</div>
                    </div>
                    {imp && (
                      <span className={cn("hidden items-center gap-1 text-label-lg sm:flex", imp.after >= imp.before ? "text-success" : "text-error")}>
                        {imp.after >= imp.before ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                        {imp.before} → {imp.after}
                      </span>
                    )}
                    <span className={cn("text-title-lg tabular-nums", scoreTone(d.report?.overallScore))}>{d.report?.overallScore ?? "—"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-body-md text-on-surface-variant">No drills yet — pick a topic above.</p>
        )}
      </section>

      {!entitlements.features.drills && (
        <section className="flex flex-wrap items-center gap-4 rounded-[28px] bg-tertiary-container p-6 text-on-tertiary-container">
          <Sparkles className="size-6" />
          <p className="min-w-0 flex-1 text-body-lg">Practice drills are part of Pro — or use an interview credit.</p>
          <Button asChild>
            <Link href="/billing">See plans</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
