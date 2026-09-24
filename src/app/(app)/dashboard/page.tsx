import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Target, Trophy, Gauge, Repeat } from "lucide-react";
import { Greeting } from "@/components/greeting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TYPE_META, type InterviewType } from "@/lib/interview/config";
import { getLatestResume, getMemory, getStats, getUser, listInterviews } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, formatDate, scoreTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK_STARTS: { type: InterviewType; label?: string; emoji?: string; jd?: boolean }[] = [
  { type: "technical" },
  { type: "hr" },
  { type: "system_design" },
  { type: "technical", label: "From JD", emoji: "📄", jd: true },
  { type: "project_deep_dive" },
  { type: "behavioral" },
];

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [user, stats, interviews, memory, resume] = await Promise.all([
    getUser(userId),
    getStats(userId),
    listInterviews(userId, 8),
    getMemory(userId),
    getLatestResume(userId),
  ]);
  const firstName = user?.name.split(" ")[0] ?? "there";
  const profile = user?.profile;
  const setupSteps = [
    { done: Boolean(profile?.targetRole && profile?.skills?.length), label: "Set your target role and skills", href: "/profile" },
    { done: Boolean(resume), label: "Upload your resume", href: "/profile#resume" },
    { done: stats.completedCount > 0, label: "Complete your first interview", href: "/interview/new" },
  ];
  const setupDone = setupSteps.every((s) => s.done);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Greeting name={firstName} />
          <p className="text-muted-foreground">
            {memory.recurringWeakTopics.length
              ? `Next time, Intervexa will dig deeper into ${memory.recurringWeakTopics[0].topic}.`
              : "Ready for your next interview?"}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/interview/new">
            Start interview <ArrowRight />
          </Link>
        </Button>
      </div>

      {!setupDone && (
        <Card className="border-primary/30 bg-accent/40">
          <CardHeader>
            <CardTitle>Get interview-ready in 3 steps</CardTitle>
            <CardDescription>The more Intervexa knows about you, the more realistic your interviews get.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {setupSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm hover:border-primary/50"
              >
                {step.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                <span className={cn(step.done && "text-muted-foreground line-through")}>{step.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Gauge} label="Interview score" hint="Average of your last 5">
          <span className={scoreTone(stats.averageScore)}>{stats.averageScore ?? "—"}</span>
          {stats.averageScore !== null && <span className="text-base font-normal text-muted-foreground">/100</span>}
        </StatCard>
        <StatCard icon={Trophy} label="Interviews completed" hint="Keep the streak going">
          {stats.completedCount}
        </StatCard>
        <StatCard icon={Target} label="Your target" hint={profile?.experienceYears ? `${profile.experienceYears} yrs experience` : "Set it in your profile"}>
          <span className="text-xl">{profile?.targetRole || "Not set"}</span>
        </StatCard>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Start an interview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_STARTS.map((q) => {
            const meta = TYPE_META[q.type];
            const href = `/interview/new?type=${q.type}${q.jd ? "&jd=1" : ""}`;
            return (
              <Link
                key={q.label ?? q.type}
                href={href}
                className="group rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
              >
                <div className="mb-2 text-2xl">{q.emoji ?? meta.emoji}</div>
                <div className="text-sm font-medium">{q.label ?? meta.label}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent interviews</CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No interviews yet. Your history and scores will show up here.
              </p>
            ) : (
              <ul className="divide-y">
                {interviews.map((iv) => {
                  const inProgress = iv.status === "in_progress";
                  const href = inProgress ? `/interview/${iv._id}` : `/interview/${iv._id}/report`;
                  return (
                    <li key={String(iv._id)}>
                      <Link href={href} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{iv.config.role}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{TYPE_META[iv.config.type].label}</span>·<span>{formatDate(iv.createdAt)}</span>
                          </div>
                        </div>
                        {inProgress ? (
                          <Badge variant="accent">Resume</Badge>
                        ) : (
                          <span className={cn("font-semibold tabular-nums", scoreTone(iv.report?.overallScore))}>
                            {iv.report?.overallScore ?? "—"}
                            <span className="text-xs font-normal text-muted-foreground">/100</span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-primary" /> Intervexa remembers
            </CardTitle>
            <CardDescription>
              Weak spots from your last {memory.interviewsConsidered > 1 ? `${memory.interviewsConsidered} interviews` : "interview"}. They come back until you improve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {memory.recurringWeakTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Complete an interview and Intervexa will track the topics you struggle with — then bring them back until you improve.
              </p>
            ) : (
              <ol className="space-y-3">
                {memory.recurringWeakTopics.map((t, i) => (
                  <li key={t.topic} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        {i + 1}. {t.topic}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Appeared in {t.count}/{memory.interviewsConsidered} interviews
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/interview/new?type=technical&focus=${encodeURIComponent(t.topic)}`}>Practice</Link>
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex-row items-center justify-between">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1 text-3xl font-bold tabular-nums">{children}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
