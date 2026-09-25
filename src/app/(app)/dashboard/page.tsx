import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Circle,
  Code2,
  FileCheck2,
  Flag,
  Flame,
  History,
  Mic,
  Network,
  Play,
  Repeat,
  Shapes,
  Target,
  Trophy,
} from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { Greeting } from "@/components/greeting";
import { TypeIcon } from "@/components/interview-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { INTERVIEW_TYPES, TYPE_META } from "@/lib/interview/config";
import { computeBadges, computeStreak, type Badge as BadgeT } from "@/lib/interview/gamification";
import { getActiveResume, getMemory, getProgressPoints, getUser, listInterviews } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, formatDate, scoreTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

const BADGE_ICON: Record<BadgeT["icon"], React.ComponentType<{ className?: string }>> = {
  flag: Flag,
  trophy: Trophy,
  network: Network,
  mic: Mic,
  "file-check": FileCheck2,
  flame: Flame,
  code: Code2,
  shapes: Shapes,
};

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [user, interviews, memory, resume, points] = await Promise.all([
    getUser(userId),
    listInterviews(userId, 6),
    getMemory(userId),
    getActiveResume(userId),
    getProgressPoints(userId),
  ]);
  const firstName = user?.name.split(" ")[0] ?? "there";
  const profile = user?.profile;
  const recentScores = points.slice(-12).map((p) => p.score);
  const last5 = points.slice(-5);
  const average = last5.length ? Math.round(last5.reduce((s, p) => s + p.score, 0) / last5.length) : null;
  const prev5 = points.slice(-10, -5);
  const prevAverage = prev5.length ? Math.round(prev5.reduce((s, p) => s + p.score, 0) / prev5.length) : null;
  const delta = average !== null && prevAverage !== null ? average - prevAverage : null;
  const streak = computeStreak(points);
  const badges = computeBadges(points);
  const earned = badges.filter((b) => b.earned);
  const inProgress = interviews.find((i) => i.status === "in_progress");
  const weakest = memory.recurringWeakTopics[0];

  const setupSteps = [
    { done: Boolean(profile?.targetRole && profile?.skills?.length), label: "Set your target role and skills", href: "/profile" },
    { done: Boolean(resume), label: "Upload your resume", href: "/profile#resumes" },
    { done: points.length > 0, label: "Complete your first interview", href: "/interview/new" },
  ];
  const setupDone = setupSteps.every((s) => s.done);

  return (
    <div className="space-y-8 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Greeting name={firstName} />
          <p className="text-body-lg text-on-surface-variant">
            {weakest ? `Next time, Intervexa will dig deeper into ${weakest.topic}.` : "Ready for your next interview?"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="tonal" size="lg">
            <Link href="/practice">
              <Target /> Practice drill
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/interview/new">
              Start interview <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero: resume the in-progress interview, else the recommended drill, else finish setup */}
      {inProgress ? (
        <HeroCard
          eyebrow="Continue where you left off"
          title={`${inProgress.config.role} · ${TYPE_META[inProgress.config.type].label}`}
          body={`Started ${formatDate(inProgress.createdAt)}. Your interviewer is waiting for your answer.`}
          href={`/interview/${inProgress._id}`}
          cta="Resume interview"
          icon={<Play className="size-6" />}
        />
      ) : weakest ? (
        <HeroCard
          eyebrow="Recommended next"
          title={`10-minute drill: ${weakest.topic}`}
          body={`This came up as a weak spot in ${weakest.count} of your last ${memory.interviewsConsidered} interviews. A short drill now, and your next interview will check if it improved.`}
          href={`/interview/new?type=technical&drill=1&focus=${encodeURIComponent(weakest.topic)}`}
          cta="Start drill"
          icon={<Repeat className="size-6" />}
        />
      ) : !setupDone ? (
        <section className="rounded-[28px] bg-primary-container p-6 text-on-primary-container sm:p-8">
          <p className="text-label-lg">Get interview-ready</p>
          <h2 className="mt-1 text-headline-sm">Three steps to your first personalised interview</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {setupSteps.map((step, i) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="state-layer flex h-full items-center gap-3 rounded-2xl bg-surface-container-lowest/70 p-4 text-on-surface"
                >
                  {step.done ? <CheckCircle2 className="size-6 shrink-0 text-success" /> : <Circle className="size-6 shrink-0 text-outline" />}
                  <span className={cn("text-title-sm", step.done && "text-on-surface-variant line-through")}>
                    {i + 1}. {step.label}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Stat tiles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Your stats">
        <StatTile label="Interview score" hint="Average of your last 5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className={cn("text-display-sm", scoreTone(average))}>
                {average ?? "—"}
                {average !== null && <span className="text-title-md text-on-surface-variant">/100</span>}
              </div>
              {delta !== null && (
                <div className={cn("text-label-lg", delta >= 0 ? "text-success" : "text-error")}>
                  {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} vs previous 5
                </div>
              )}
            </div>
            <Sparkline values={recentScores} width={96} />
          </div>
        </StatTile>
        <StatTile label="Interviews completed" hint={`${points.filter((p) => p.drill).length} practice drills`}>
          <div className="text-display-sm">{points.length}</div>
        </StatTile>
        <StatTile label="Practice streak" hint={streak.practicedToday ? "You practised today" : "Practise today to keep it going"}>
          <div className="flex items-center gap-2">
            <Flame className={cn("size-7", streak.current ? "text-tertiary" : "text-outline")} />
            <span className="text-display-sm">{streak.current}</span>
            <span className="text-body-md text-on-surface-variant">day{streak.current === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-2 flex gap-1.5" aria-label="Last 7 days">
            {streak.week.map((d) => (
              <span key={d.day} title={d.day} className={cn("h-1.5 flex-1 rounded-full", d.practiced ? "bg-tertiary" : "bg-surface-container-highest")} />
            ))}
          </div>
        </StatTile>
        <StatTile label="Your target" hint={profile?.experienceYears ? `${profile.experienceYears} yrs experience` : "Set it in your profile"}>
          <div className="truncate text-headline-sm">{profile?.targetRole || "Not set"}</div>
        </StatTile>
      </section>

      {/* Round types */}
      <section aria-labelledby="start-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="start-heading" className="text-title-lg">Start a round</h2>
          <Link href="/loops" className="text-label-lg text-primary hover:underline">
            Run a full mock loop →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {INTERVIEW_TYPES.map((t) => (
            <Link
              key={t}
              href={`/interview/new?type=${t}`}
              className="state-layer group flex flex-col gap-4 rounded-3xl bg-surface-container-low p-4 transition-shadow hover:shadow-elevation-1"
            >
              <TypeIcon type={t} size="lg" />
              <div>
                <div className="text-title-sm">{TYPE_META[t].label}</div>
                <div className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{TYPE_META[t].blurb}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-outline-variant bg-card" aria-labelledby="recent-heading">
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <h2 id="recent-heading" className="text-title-lg">Recent interviews</h2>
            <Button asChild variant="text" size="sm">
              <Link href="/history">
                <History /> View all
              </Link>
            </Button>
          </div>
          {interviews.length === 0 ? (
            <EmptyState
              icon={<History />}
              title="No interviews yet"
              body="Your history, scores and reports will show up here."
              action={
                <Button asChild>
                  <Link href="/interview/new">Start your first interview</Link>
                </Button>
              }
            />
          ) : (
            <ul className="px-2 pb-3">
              {interviews.map((iv) => {
                const live = iv.status === "in_progress";
                return (
                  <li key={String(iv._id)}>
                    <Link
                      href={live ? `/interview/${iv._id}` : `/interview/${iv._id}/report`}
                      className="state-layer flex items-center gap-4 rounded-2xl px-4 py-3"
                    >
                      <TypeIcon type={iv.config.type} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-title-sm">
                          {iv.config.drill ? `Drill · ${iv.config.focus}` : iv.config.role}
                        </div>
                        <div className="text-body-sm text-on-surface-variant">
                          {TYPE_META[iv.config.type].label} · {formatDate(iv.createdAt)}
                        </div>
                      </div>
                      {live ? (
                        <Badge variant="primary">In progress</Badge>
                      ) : iv.reportStatus === "pending" ? (
                        <Badge variant="secondary">Generating…</Badge>
                      ) : (
                        <span className={cn("text-title-md tabular-nums", scoreTone(iv.report?.overallScore))}>
                          {iv.report?.overallScore ?? "—"}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl bg-surface-container-low p-6" aria-labelledby="remember-heading">
            <h2 id="remember-heading" className="flex items-center gap-2 text-title-lg">
              <Repeat className="size-5 text-primary" /> Intervexa remembers
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {memory.interviewsConsidered
                ? `Weak spots from your last ${memory.interviewsConsidered === 1 ? "interview" : `${memory.interviewsConsidered} interviews`}. They come back until you improve.`
                : "Finish an interview and your weak spots will be tracked here."}
            </p>
            {memory.recurringWeakTopics.length > 0 && (
              <ol className="mt-4 space-y-2">
                {memory.recurringWeakTopics.map((t) => (
                  <li key={t.topic} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-title-sm">{t.topic}</div>
                      <div className="text-body-sm text-on-surface-variant">
                        In {t.count} of {memory.interviewsConsidered} interviews
                      </div>
                    </div>
                    <Button asChild size="sm" variant="tonal">
                      <Link href={`/interview/new?type=technical&drill=1&focus=${encodeURIComponent(t.topic)}`}>Drill</Link>
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-3xl bg-surface-container-low p-6" aria-labelledby="badges-heading">
            <div className="flex items-center justify-between">
              <h2 id="badges-heading" className="flex items-center gap-2 text-title-lg">
                <Award className="size-5 text-primary" /> Badges
              </h2>
              <span className="text-body-md text-on-surface-variant">
                {earned.length}/{badges.length}
              </span>
            </div>
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {badges.map((b) => {
                const Icon = BADGE_ICON[b.icon];
                return (
                  <li key={b.id} title={`${b.name} — ${b.description}`} className="flex flex-col items-center gap-1 text-center">
                    <span
                      className={cn(
                        "grid size-12 place-items-center rounded-2xl",
                        b.earned ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-highest text-outline",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className={cn("line-clamp-2 text-label-sm", !b.earned && "text-on-surface-variant")}>{b.name}</span>
                  </li>
                );
              })}
            </ul>
            <Link href="/progress" className="mt-4 inline-block text-label-lg text-primary hover:underline">
              See your progress →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  eyebrow,
  title,
  body,
  href,
  cta,
  icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="flex flex-wrap items-center gap-6 rounded-[28px] bg-primary-container p-6 text-on-primary-container sm:p-8">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary text-on-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-label-lg">{eyebrow}</p>
        <h2 className="mt-1 text-headline-sm">{title}</h2>
        <p className="mt-1 max-w-2xl text-body-lg opacity-85">{body}</p>
      </div>
      <Button asChild size="lg">
        <Link href={href}>
          {cta} <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}

function StatTile({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-outline-variant bg-card p-5">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className="mt-3">{children}</div>
      <div className="mt-2 text-body-sm text-on-surface-variant">{hint}</div>
    </div>
  );
}
