import { describe, expect, it } from "vitest";
import { analyzeCommunication, countFillers, countWords } from "@/lib/analysis/communication";

describe("countWords", () => {
  it("counts words including tech tokens", () => {
    expect(countWords("I used Node.js and C++ with 3 services")).toBe(8);
    expect(countWords("   ")).toBe(0);
  });
});

describe("countFillers", () => {
  it("counts common filler words", () => {
    const counts = countFillers("Um, so basically I, uh, used Redis. Basically it was, like, fast.");
    expect(counts).toEqual({ um: 1, uh: 1, like: 1, basically: 2 });
  });

  it("ignores legitimate uses of 'like' and 'you know how'", () => {
    const counts = countFillers(
      "I would like to add caching. It looks like the index was missing. Do you know how it works? Something like that.",
    );
    expect(counts.like).toBeUndefined();
    expect(counts["you know"]).toBeUndefined();
  });
});

describe("analyzeCommunication", () => {
  it("aggregates stats and computes pace for voice answers", () => {
    const stats = analyzeCommunication([
      { answer: "um I think we used MongoDB because the schema changed often", inputMode: "voice", answerDurationSec: 6 },
      { answer: "Yes.", inputMode: "text" },
      { answer: undefined },
    ]);
    expect(stats.answers).toBe(2);
    expect(stats.totalWords).toBe(12);
    expect(stats.shortAnswers).toBe(2);
    expect(stats.fillerWords).toEqual({ um: 1 });
    expect(stats.wordsPerMinute).toBe(110);
    expect(stats.fillerPer100Words).toBeCloseTo(8.3, 1);
  });

  it("returns null pace when there is no voice input", () => {
    expect(analyzeCommunication([{ answer: "hello there", inputMode: "text" }]).wordsPerMinute).toBeNull();
  });
});
