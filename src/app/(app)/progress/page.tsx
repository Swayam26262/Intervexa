import type { Metadata } from "next";
import Link from "next/link";
import { Award, BarChart3, Code2, FileCheck2, Flag, Flame, Mic, Network, Shapes, Sparkles, Trophy } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { Dumbbell } from "@/components/charts/dumbbell";
import { LineChart } from "@/components/charts/line-chart";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getEntitlements } from "@/lib/billing/service";
import { TYPE_META, type InterviewType } from "@/lib/interview/config";
import { computeBadges, computeStreak, type Badge as BadgeT } from "@/lib/interview/gamification";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/interview/types";
import { getProgressPoints, getTopicMastery } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Progress" };

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

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export default async function ProgressPage() {
  const userId = await requireUserId();
  const [points, mastery, entitlements] = await Promise.all([getProgressPoints(userId), getTopicMastery(userId), getEntitlements(userId)]);
  const interviews = points.filter((p) => !p.drill);

  if (points.length === 0) {
    return (
      <div>
        <PageHeader title="Progress" description="Track how your scores, topics and communication change over time." />
        <EmptyState
          icon={<BarChart3 />}
          title="Your progress starts with one interview"
          body="Complete an interview and your score trend, topic mastery and badges will appear here."
          action={
            <Button asChild>
              <Link href="/interview/new">Start an interview</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const scores = interviews.map((p) => p.score);
  const last5 = avg(scores.slice(-5));
  const prev5 = avg(scores.slice(-10, -5));
  const streak = computeStreak(points);
  const badges = computeBadges(points);
  const window = Math.max(1, Math.min(3, Math.floor(interviews.length / 2)));
  const categoryDeltas = CATEGORY_KEYS.map((key) => {
    const values = interviews.map((p) => p.categories[key]).filter((v): v is number => v !== null && v !== undefined);
    const early = avg(values.slice(0, window));
    const recent = avg(values.slice(-window));
    return { key, label: CATEGORY_LABELS[key], recent, delta: early !== null && recent !== null && values.length > window ? Math.round(recent - early) : null };
  }).filter((c) => c.recent !== null);
  const byType = (Object.keys(TYPE_META) as InterviewType[])
    .map((t) => {
      const list = interviews.filter((p) => p.type === t);
      return { type: t, count: list.length, average: avg(list.map((p) => p.score)) };
    })
    .filter((t) => t.count > 0);
  const voice = interviews.filter((p) => p.wpm !== null);
  const analytics = entitlements.features.analytics;

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="How your scores, topics and communication are changing." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Summary">
        <Kpi label="Average score" value={last5 !== null ? String(Math.round(last5)) : "—"} hint="Last 5 interviews">
          {last5 !== null && prev5 !== null && (
            <span className={cn("text-label-lg", last5 >= prev5 ? "text-success" : "text-error")}>
              {last5 >= prev5 ? "▲" : "▼"} {Math.abs(Math.round(last5 - prev5))} vs previous 5
            </span>
          )}
        </Kpi>
        <Kpi label="Best score" value={scores.length ? String(Math.max(...scores)) : "—"} hint="All time" />
        <Kpi label="Completed" value={String(points.length)} hint={`${interviews.length} interviews · ${points.length - interviews.length} drills`} />
        <Kpi label="Streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} hint={`Longest: ${streak.longest} day${streak.longest === 1 ? "" : "s"}`} />
      </section>

      {interviews.length > 0 && (
        <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="trend-heading">
          <h2 id="trend-heading" className="text-title-lg">
            Overall score
          </h2>
          <p className="mb-4 text-body-md text-on-surface-variant">Each point is one interview (drills excluded). Hover or use the arrow keys for details.</p>
          <LineChart
            ariaLabel={`Overall score across ${interviews.length} interviews, latest ${scores[scores.length - 1]}`}
            points={interviews.map((p) => ({
              x: new Date(p.at),
              y: p.score,
              meta: [
                { label: "Round", value: TYPE_META[p.type].label },
                { label: "Role", value: p.role },
              ],
            }))}
          />
          <details className="mt-4">
            <summary className="text-label-lg text-primary">View as table</summary>
            <table className="mt-3 w-full text-left text-body-md">
              <thead className="text-label-md text-on-surface-variant">
                <tr>
                  <th className="py-2 font-semibold">Date</th>
                  <th className="py-2 font-semibold">Round</th>
                  <th className="py-2 font-semibold">Role</th>
                  <th className="py-2 text-right font-semibold">Score</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...interviews].reverse().map((p) => (
                  <tr key={p.id} className="border-t border-outline-variant">
                    <td className="py-2">{formatDate(p.at)}</td>
                    <td className="py-2">{TYPE_META[p.type].label}</td>
                    <td className="py-2">{p.role}</td>
                    <td className="py-2 text-right">
                      <Link href={`/interview/${p.id}/report`} className="text-primary hover:underline">
                        {p.score}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
      )}

      {analytics ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="cat-heading">
              <h2 id="cat-heading" className="text-title-lg">
                Skills over time
              </h2>
              <p className="mb-4 text-body-md text-on-surface-variant">Recent average, and the change since your first interviews.</p>
              <ul className="divide-y divide-outline-variant">
                {categoryDeltas.map((c) => (
                  <li key={c.key} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-body-lg">{c.label}</span>
                    <span className="flex items-center gap-4">
                      <span className="text-title-md tabular-nums">{Math.round(c.recent!)}</span>
                      <span
                        className={cn(
                          "w-20 text-right text-label-lg tabular-nums",
                          c.delta === null ? "text-on-surface-variant" : c.delta >= 0 ? "text-success" : "text-error",
                        )}
                      >
                        {c.delta === null ? "—" : `${c.delta >= 0 ? "▲" : "▼"} ${Math.abs(c.delta)}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="type-heading">
              <h2 id="type-heading" className="text-title-lg">
                Average by round
              </h2>
              <p className="mb-4 text-body-md text-on-surface-variant">Where you&apos;re strongest, and where to practise.</p>
              <BarList
                items={byType
                  .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
                  .map((t) => ({ key: t.type, label: `${TYPE_META[t.type].label} · ${t.count}`, value: Math.round(t.average ?? 0) }))}
              />
            </section>
          </div>

          {mastery.length > 0 && (
            <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="mastery-heading">
              <h2 id="mastery-heading" className="text-title-lg">
                Topic mastery
              </h2>
              <p className="mb-4 text-body-md text-on-surface-variant">First attempt vs latest, out of 10, for topics you&apos;ve been asked about.</p>
              <Dumbbell
                rows={mastery.slice(0, 10).map((m) => ({ key: m.topic, label: m.topic, first: m.first, latest: m.latest, attempts: m.attempts }))}
              />
            </section>
          )}

          {voice.length > 1 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="pace-heading">
                <h2 id="pace-heading" className="text-title-lg">
                  Speaking pace
                </h2>
                <p className="mb-4 text-body-md text-on-surface-variant">Words per minute in voice interviews. 120–160 is comfortable.</p>
                <LineChart
                  height={180}
                  yMax={220}
                  yTicks={[0, 60, 120, 180]}
                  ariaLabel="Speaking pace over voice interviews"
                  points={voice.map((p) => ({ x: new Date(p.at), y: p.wpm!, meta: [{ label: "Round", value: TYPE_META[p.type].label }] }))}
                />
              </section>
              <section className="rounded-[28px] border border-outline-variant bg-card p-6" aria-labelledby="filler-heading">
                <h2 id="filler-heading" className="text-title-lg">
                  Filler words
                </h2>
                <p className="mb-4 text-body-md text-on-surface-variant">Per 100 words. Lower is better; under 1 is excellent.</p>
                <LineChart
                  height={180}
                  yMax={10}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  ariaLabel="Filler words per 100 words over interviews"
                  points={interviews.map((p) => ({ x: new Date(p.at), y: Math.round(p.fillerRate * 10) / 10, meta: [{ label: "Round", value: TYPE_META[p.type].label }] }))}
                />
              </section>
            </div>
          )}
        </>
      ) : (
        <section className="flex flex-wrap items-center gap-4 rounded-[28px] bg-tertiary-container p-6 text-on-tertiary-container">
          <Sparkles className="size-6" />
          <div className="min-w-0 flex-1">
            <h2 className="text-title-md">See skills over time, topic mastery and pace trends</h2>
            <p className="text-body-md opacity-85">Detailed analytics are part of Pro.</p>
          </div>
          <Button asChild>
            <Link href="/billing">See plans</Link>
          </Button>
        </section>
      )}

      <section className="rounded-[28px] bg-surface-container-low p-6" aria-labelledby="badges-heading">
        <h2 id="badges-heading" className="flex items-center gap-2 text-title-lg">
          <Award className="size-5 text-primary" /> Badges
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => {
            const Icon = BADGE_ICON[b.icon];
            return (
              <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-4">
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-2xl",
                    b.earned ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-highest text-outline",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-title-sm">{b.name}</div>
                  <div className="text-body-sm text-on-surface-variant">{b.earned ? "Earned" : b.description}</div>
                  {!b.earned && (
                    <div className="mt-1.5 h-1 rounded-full bg-surface-container-highest">
                      <div className="h-full rounded-full bg-tertiary" style={{ width: `${Math.round(b.progress * 100)}%` }} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, children }: { label: string; value: string; hint: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-outline-variant bg-card p-5">
      <div className="text-label-lg text-on-surface-variant">{label}</div>
      <div className="mt-2 text-display-sm">{value}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-body-sm text-on-surface-variant">
        {children}
        <span>{hint}</span>
      </div>
    </div>
  );
}
