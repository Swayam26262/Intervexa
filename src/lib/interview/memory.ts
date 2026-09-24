import type { CandidateMemory, InterviewReport } from "./types";

export const MEMORY_WINDOW = 5;

/** Canonical key so "Database scaling" and "database  Scaling" count as the same topic. */
export function topicKey(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

/**
 * Builds what Intervexa "remembers" about a candidate from their most recent completed
 * reports (newest first): recurring weak topics and their last score.
 */
export function buildMemory(reports: Pick<InterviewReport, "weakTopics" | "overallScore">[]): CandidateMemory {
  const recent = reports.slice(0, MEMORY_WINDOW);
  const counts = new Map<string, { topic: string; count: number; firstSeen: number }>();
  recent.forEach((report, i) => {
    const seen = new Set<string>();
    for (const topic of report.weakTopics ?? []) {
      const key = topicKey(topic);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { topic: topic.trim(), count: 1, firstSeen: i });
    }
  });

  const recurringWeakTopics = [...counts.values()]
    // Most frequent first; ties go to the most recent interview.
    .sort((a, b) => b.count - a.count || a.firstSeen - b.firstSeen)
    .slice(0, 5)
    .map(({ topic, count }) => ({ topic, count }));

  return {
    interviewsConsidered: recent.length,
    recurringWeakTopics,
    lastScore: recent[0]?.overallScore,
  };
}
