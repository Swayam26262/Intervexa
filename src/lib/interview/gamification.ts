import type { InterviewType } from "./config";

export interface ActivityPoint {
  at: Date;
  type: InterviewType;
  score: number;
  fillerRate: number;
  drill?: boolean;
}

/** Calendar day key in the app's timezone (India by default). */
export function dayKey(date: Date, timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata"): string {
  return date.toLocaleDateString("en-CA", { timeZone });
}

function prevDay(key: string): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface Streak {
  current: number;
  longest: number;
  practicedToday: boolean;
  /** Last 7 days (oldest first) with whether the user practised. */
  week: { day: string; practiced: boolean }[];
}

/** Consecutive days with at least one completed interview, ending today (or yesterday). */
export function computeStreak(points: Pick<ActivityPoint, "at">[], now: Date = new Date()): Streak {
  const days = new Set(points.map((p) => dayKey(p.at)));
  const today = dayKey(now);
  let cursor = days.has(today) ? today : prevDay(today);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = prevDay(cursor);
  }
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && prevDay(sorted[i]) === sorted[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const week: Streak["week"] = [];
  let d = today;
  for (let i = 0; i < 7; i++) {
    week.unshift({ day: d, practiced: days.has(d) });
    d = prevDay(d);
  }
  return { current, longest, practicedToday: days.has(today), week };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: "flag" | "trophy" | "network" | "mic" | "file-check" | "flame" | "code" | "shapes";
  earned: boolean;
  /** 0-1 progress toward the badge. */
  progress: number;
}

export function computeBadges(points: ActivityPoint[], now: Date = new Date()): Badge[] {
  const count = points.length;
  const sd = points.filter((p) => p.type === "system_design");
  const sdAvg = sd.length ? sd.reduce((s, p) => s + p.score, 0) / sd.length : 0;
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const lastWeek = points.filter((p) => p.at.getTime() >= weekAgo);
  const cleanWeek = lastWeek.filter((p) => p.fillerRate < 1);
  const bestDeepDive = Math.max(0, ...points.filter((p) => p.type === "project_deep_dive").map((p) => p.score));
  const bestCoding = Math.max(0, ...points.filter((p) => p.type === "coding").map((p) => p.score));
  const types = new Set(points.map((p) => p.type));
  const streak = computeStreak(points, now);

  return [
    { id: "first", name: "First Interview", description: "Complete your first mock interview.", icon: "flag", earned: count >= 1, progress: Math.min(1, count) },
    { id: "ten", name: "10 Interviews", description: "Complete ten interviews.", icon: "trophy", earned: count >= 10, progress: Math.min(1, count / 10) },
    {
      id: "streak7",
      name: "7-Day Streak",
      description: "Practise seven days in a row.",
      icon: "flame",
      earned: streak.longest >= 7,
      progress: Math.min(1, streak.longest / 7),
    },
    {
      id: "system-design",
      name: "System Design Master",
      description: "Average 80+ across three system design rounds.",
      icon: "network",
      earned: sd.length >= 3 && sdAvg >= 80,
      progress: Math.min(1, sd.length / 3) * Math.min(1, sdAvg / 80),
    },
    {
      id: "no-filler",
      name: "No-Filler Week",
      description: "Three interviews in a week with under 1 filler word per 100.",
      icon: "mic",
      earned: cleanWeek.length >= 3,
      progress: Math.min(1, cleanWeek.length / 3),
    },
    {
      id: "resume-crusher",
      name: "Resume Crusher",
      description: "Score 80+ in a project deep dive.",
      icon: "file-check",
      earned: bestDeepDive >= 80,
      progress: Math.min(1, bestDeepDive / 80),
    },
    { id: "green-tests", name: "Green Tests", description: "Score 75+ in a coding round.", icon: "code", earned: bestCoding >= 75, progress: Math.min(1, bestCoding / 75) },
    {
      id: "well-rounded",
      name: "Well-Rounded",
      description: "Complete four different round types.",
      icon: "shapes",
      earned: types.size >= 4,
      progress: Math.min(1, types.size / 4),
    },
  ];
}
