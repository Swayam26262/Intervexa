import { describe, expect, it } from "vitest";
import { buildMemory } from "@/lib/interview/memory";
import { normalizeReport, sameTopicStreak, turnInfo } from "@/lib/interview/progress";
import type { Turn } from "@/lib/interview/types";

describe("buildMemory", () => {
  it("ranks weak topics by recurrence across recent reports (case-insensitive)", () => {
    const memory = buildMemory([
      { weakTopics: ["Database Scaling", "AWS"], overallScore: 70 },
      { weakTopics: ["database scaling"], overallScore: 64 },
      { weakTopics: ["System Design", "AWS"], overallScore: 58 },
      { weakTopics: ["Testing"], overallScore: 61 },
    ]);
    expect(memory.interviewsConsidered).toBe(4);
    expect(memory.lastScore).toBe(70);
    expect(memory.recurringWeakTopics).toEqual([
      { topic: "Database Scaling", count: 2 },
      { topic: "AWS", count: 2 },
      { topic: "System Design", count: 1 },
      { topic: "Testing", count: 1 },
    ]);
  });

  it("keeps single weak topics from the latest interview", () => {
    const memory = buildMemory([{ weakTopics: ["Caching"], overallScore: 50 }]);
    expect(memory.recurringWeakTopics).toEqual([{ topic: "Caching", count: 1 }]);
  });

  it("handles no history", () => {
    expect(buildMemory([])).toEqual({ interviewsConsidered: 0, recurringWeakTopics: [], lastScore: undefined });
  });
});

const turn = (index: number, topic: string, extra: Partial<Turn> = {}): Turn => ({
  index,
  topic,
  action: "follow_up",
  question: `Q${index}`,
  askedAt: new Date(0),
  ...extra,
});

describe("progress", () => {
  it("counts consecutive questions on the same topic", () => {
    expect(sameTopicStreak([turn(1, "A"), turn(2, "B"), turn(3, "b"), turn(4, "B")])).toBe(3);
    expect(sameTopicStreak([])).toBe(0);
  });

  it("forces wrap-up when time or question budget runs out", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    expect(turnInfo([turn(1, "A")], start, 15, new Date("2026-01-01T10:05:00Z")).mustWrapUp).toBe(false);
    expect(turnInfo([turn(1, "A")], start, 15, new Date("2026-01-01T10:15:00Z")).mustWrapUp).toBe(true);
    const many = Array.from({ length: 7 }, (_, i) => turn(i + 1, "A"));
    expect(turnInfo(many, start, 15, new Date("2026-01-01T10:01:00Z")).mustWrapUp).toBe(true);
  });

  it("normalizes a report: clamps scores and backfills skipped questions", () => {
    const ev = { score: 6, signal: "adequate" as const, strengths: ["x"], missing: ["y"], note: "" };
    const turns = [
      turn(1, "A", { answer: "a", evaluation: ev }),
      turn(2, "A", { answer: "b", evaluation: { ...ev, signal: "clarification" } }),
      turn(3, "B", { answer: "c", evaluation: ev }),
    ];
    const report = normalizeReport(
      {
        overallScore: 140,
        categoryScores: {
          technicalKnowledge: 55.4,
          problemSolving: null,
          communication: -3,
          projectUnderstanding: 70,
          confidence: 60,
          clarity: 65,
        },
        summary: " ok ",
        strengths: ["s", ""],
        weaknesses: [],
        weakTopics: ["A"],
        missedTopics: [],
        suggestedTopics: [],
        questions: [{ turnIndex: 1, score: 12, didWell: [], missing: [], betterAnswer: "b" }, { turnIndex: 99, score: 1, didWell: [], missing: [], betterAnswer: "" }],
      },
      turns,
    );
    expect(report.overallScore).toBe(100);
    expect(report.categoryScores.technicalKnowledge).toBe(55);
    expect(report.categoryScores.problemSolving).toBeNull();
    expect(report.categoryScores.communication).toBe(0);
    expect(report.summary).toBe("ok");
    expect(report.strengths).toEqual(["s"]);
    expect(report.questions.map((q) => q.turnIndex)).toEqual([1, 3]);
    expect(report.questions[0].score).toBe(10);
    expect(report.questions[1].missing).toEqual(["y"]);
  });
});
