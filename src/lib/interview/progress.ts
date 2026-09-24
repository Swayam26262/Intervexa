import { maxQuestionsFor } from "./config";
import type { AnswerEvaluation, InterviewReport, ReportDraft, Turn } from "./types";
import { CATEGORY_KEYS } from "./types";

export interface TurnInfo {
  questionsAsked: number;
  maxQuestions: number;
  minutesElapsed: number;
  sameTopicStreak: number;
  mustWrapUp: boolean;
}

/** Number of consecutive questions (ending with the latest) on the latest topic. */
export function sameTopicStreak(turns: Pick<Turn, "topic">[]): number {
  if (!turns.length) return 0;
  const topic = turns[turns.length - 1].topic.toLowerCase();
  let streak = 0;
  for (let i = turns.length - 1; i >= 0 && turns[i].topic.toLowerCase() === topic; i--) streak++;
  return streak;
}

export function turnInfo(
  turns: Pick<Turn, "topic">[],
  startedAt: Date,
  durationMinutes: number,
  now: Date = new Date(),
): TurnInfo {
  const maxQuestions = maxQuestionsFor(durationMinutes);
  const minutesElapsed = Math.max(0, (now.getTime() - startedAt.getTime()) / 60000);
  const questionsAsked = turns.length;
  return {
    questionsAsked,
    maxQuestions,
    minutesElapsed,
    sameTopicStreak: sameTopicStreak(turns),
    mustWrapUp: questionsAsked >= maxQuestions || minutesElapsed >= durationMinutes,
  };
}

const clamp = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

const tidyList = (items: string[] | undefined, max = 6) =>
  (items ?? []).map((s) => s.trim()).filter(Boolean).slice(0, max);

export function normalizeEvaluation(ev: AnswerEvaluation): AnswerEvaluation {
  return {
    score: Math.round(clamp(ev.score, 0, 10) * 10) / 10,
    signal: ev.signal,
    strengths: tidyList(ev.strengths, 5),
    missing: tidyList(ev.missing, 5),
    note: ev.note?.trim() ?? "",
  };
}

/** Scored turns: answered and not a clarification request. */
export function scoredTurns(turns: Turn[]): Turn[] {
  return turns.filter(
    (t) => t.answer !== undefined && t.evaluation && t.evaluation.signal !== "clarification",
  );
}

/**
 * Clamps scores, drops feedback for unknown questions and backfills feedback for
 * any answered question the model skipped, so the report always lines up with the transcript.
 */
export function normalizeReport(draft: ReportDraft, turns: Turn[]): ReportDraft {
  const scored = scoredTurns(turns);
  const byIndex = new Map(draft.questions.map((q) => [q.turnIndex, q]));
  const questions = scored.map((t) => {
    const q = byIndex.get(t.index);
    if (q) {
      return {
        turnIndex: t.index,
        score: Math.round(clamp(q.score, 0, 10) * 10) / 10,
        didWell: tidyList(q.didWell, 5),
        missing: tidyList(q.missing, 5),
        betterAnswer: q.betterAnswer?.trim() ?? "",
      };
    }
    return {
      turnIndex: t.index,
      score: t.evaluation!.score,
      didWell: t.evaluation!.strengths,
      missing: t.evaluation!.missing,
      betterAnswer: t.evaluation!.missing.length
        ? `A stronger answer would also cover: ${t.evaluation!.missing.join(", ")}.`
        : "",
    };
  });

  const categoryScores = {} as InterviewReport["categoryScores"];
  for (const key of CATEGORY_KEYS) {
    const value = draft.categoryScores[key];
    categoryScores[key] = value === null || value === undefined ? null : Math.round(clamp(value, 0, 100));
  }

  return {
    overallScore: Math.round(clamp(draft.overallScore, 0, 100)),
    categoryScores,
    summary: draft.summary.trim(),
    strengths: tidyList(draft.strengths),
    weaknesses: tidyList(draft.weaknesses),
    weakTopics: tidyList(draft.weakTopics, 4),
    missedTopics: tidyList(draft.missedTopics, 8),
    suggestedTopics: tidyList(draft.suggestedTopics),
    questions,
  };
}
