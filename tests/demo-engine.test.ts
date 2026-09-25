import { describe, expect, it } from "vitest";
import { demoEngine } from "@/lib/ai/demo/engine";
import { heuristicEvaluate } from "@/lib/ai/demo/heuristics";
import { buildDemoTopics, mentions } from "@/lib/ai/demo/question-bank";
import { analyzeCommunication } from "@/lib/analysis/communication";
import { turnInfo } from "@/lib/interview/progress";
import type { InterviewContext, Turn } from "@/lib/interview/types";

const baseCtx = (overrides: Partial<InterviewContext["config"]> = {}, extra: Partial<InterviewContext> = {}): InterviewContext => ({
  candidate: { name: "Swayam Patil", skills: ["Python", "React", "MongoDB", "RAG"] },
  config: {
    role: "AI Engineer",
    experienceYears: 1,
    type: "technical",
    difficulty: "medium",
    durationMinutes: 30,
    personality: "professional",
    answerMode: "text",
    useResume: false,
    ...overrides,
  },
  ...extra,
});

const STRONG =
  "I would start with chunking the documents by semantic sections with some overlap, because splitting mid-sentence hurts retrieval. " +
  "Then I generate embeddings and store them in a vector database with metadata like source and date, so I can filter. " +
  "At query time I retrieve the top 20 chunks, rerank them with a cross-encoder, and put the best 5 into the prompt with citations. " +
  "For example, in my last project this reduced hallucinations noticeably, and the trade-off was about 150ms of extra latency.";

async function answer(ctx: InterviewContext, turns: Turn[], text: string) {
  const plan = (await demoEngine.plan(ctx)).plan;
  const answered = [...turns.slice(0, -1), { ...turns[turns.length - 1], answer: text, inputMode: "text" as const }];
  const info = turnInfo(answered, new Date(), ctx.config.durationMinutes);
  return { answered, result: await demoEngine.nextTurn(ctx, plan, answered, info) };
}

describe("heuristicEvaluate", () => {
  it("rates a specific, keyword-rich answer as strong", () => {
    const ev = heuristicEvaluate(STRONG, ["chunking", "embeddings", "vector", "retrieval", "rerank", "metadata"]);
    expect(ev.signal).toBe("strong");
    expect(ev.score).toBeGreaterThanOrEqual(7.5);
  });

  it("detects knowledge gaps and clarification requests", () => {
    expect(heuristicEvaluate("Honestly I don't know how that works.", ["index"]).signal).toBe("gap");
    expect(heuristicEvaluate("Sorry, could you repeat the question?", ["index"]).signal).toBe("clarification");
  });

  it("rates a vague unjustified answer as weak", () => {
    const ev = heuristicEvaluate("I used MongoDB because it's faster and it's good.", ["schema", "joins", "transactions", "consistency"]);
    expect(["weak", "gap"]).toContain(ev.signal);
  });
});

describe("mentions", () => {
  it("matches whole terms only", () => {
    expect(mentions("AI Engineer", "ai")).toBe(true);
    expect(mentions("Failure handling", "ai")).toBe(false);
    expect(mentions("Built with Next.js", "js")).toBe(false);
    expect(mentions("Built with Next.js", "next.js")).toBe(true);
    expect(mentions("I know JS.", "js")).toBe(true);
  });
});

describe("demo engine", () => {
  it("plans a skill-aware technical interview", async () => {
    const out = await demoEngine.plan(baseCtx());
    expect(out.greeting).toContain("Hi Swayam.");
    expect(out.openingTopic).toBe("Project Walkthrough");
    const names = out.plan.topics.map((t) => t.name);
    expect(names).toContain("LLMs & RAG");
    expect(names).toContain("Databases");
  });

  it("mentions and prioritises recurring weak topics", async () => {
    const ctx = baseCtx({}, { memory: { interviewsConsidered: 3, recurringWeakTopics: [{ topic: "Databases", count: 2 }] } });
    const out = await demoEngine.plan(ctx);
    expect(out.greeting).toContain("Databases came up as a weak spot in 2 of your recent interviews");
    expect(out.plan.topics[1].name).toBe("Databases");
  });

  it("adapts: probes vague answers, goes easier on gaps, moves on after strong answers", async () => {
    const ctx = baseCtx();
    const topics = buildDemoTopics(ctx);
    const rag = topics.find((t) => t.name === "LLMs & RAG")!;
    const start: Turn[] = [{ index: 1, topic: rag.name, action: "next_topic", question: rag.main.text, askedAt: new Date() }];

    const vague = await answer(ctx, start, "I would just use some AI model and it would work fine, it is good.");
    expect(vague.result.action).toBe("probe");
    expect(vague.result.message).toMatch(/You said "/);

    const gap = await answer(ctx, start, "I don't know.");
    expect(gap.result.action).toBe("easier");
    expect(gap.result.message).toContain(rag.easier.text);

    const strong = await answer(ctx, start, STRONG);
    expect(strong.result.action).toBe("next_topic");
    expect(strong.result.topic).not.toBe(rag.name);

    const clarify = await answer(ctx, start, "Can you repeat that?");
    expect(clarify.result.action).toBe("clarify");
    expect(clarify.result.message).toContain(rag.main.text);
  });

  it("wraps up when forced", async () => {
    const ctx = baseCtx();
    const plan = (await demoEngine.plan(ctx)).plan;
    const turns: Turn[] = [{ index: 1, topic: "Project Walkthrough", action: "opening", question: "q", askedAt: new Date(), answer: STRONG }];
    const result = await demoEngine.nextTurn(ctx, plan, turns, {
      questionsAsked: 1,
      maxQuestions: 13,
      minutesElapsed: 31,
      sameTopicStreak: 1,
      mustWrapUp: true,
    });
    expect(result.action).toBe("wrap_up");
    expect(result.message).toMatch(/report is ready/);
  });

  it("builds a coherent report from a transcript", async () => {
    const ctx = baseCtx();
    const plan = (await demoEngine.plan(ctx)).plan;
    const ev = (score: number, signal: "strong" | "weak" | "gap") => ({ score, signal, strengths: ["x"], missing: ["rerank"], note: "" });
    const turns: Turn[] = [
      { index: 1, topic: "Project Walkthrough", action: "opening", question: "q1", askedAt: new Date(), answer: STRONG, evaluation: ev(8.5, "strong") },
      { index: 2, topic: "Databases", action: "next_topic", question: "q2", askedAt: new Date(), answer: "um I don't know", evaluation: ev(1.5, "gap") },
      { index: 3, topic: "Databases", action: "easier", question: "q3", askedAt: new Date(), answer: "It makes reads faster.", evaluation: ev(3.5, "weak") },
    ];
    const report = await demoEngine.report(ctx, plan, turns, analyzeCommunication(turns));
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.weakTopics).toEqual(["Databases"]); // warm-up topics are never memory tags
    expect(report.questions).toHaveLength(3);
    expect(report.categoryScores.technicalKnowledge).not.toBeNull();
    expect(report.summary).toMatch(/Focus your next practice on Databases/);
  });

  it("builds project deep dive topics from resume projects and claims", () => {
    const topics = buildDemoTopics(
      baseCtx(
        { type: "project_deep_dive" },
        {
          resume: {
            headline: "",
            summary: "",
            totalExperienceYears: 1,
            skills: [],
            strongAreas: [],
            weakAreas: [],
            projects: [{ name: "ParkEase", summary: "Parking app", technologies: ["Redis Streams", "Node.js"], claims: [] }],
            experience: [],
            claimsToVerify: [{ claim: "Built a production-grade RAG pipeline", followUpQuestions: ["How did you evaluate retrieval?"] }],
          },
        },
      ),
    );
    expect(topics[0].name).toBe("ParkEase");
    expect(topics[0].followUps[0].text).toContain("Why did you choose Redis Streams for ParkEase");
    expect(topics.some((t) => t.main.text.includes("production-grade RAG pipeline"))).toBe(true);
  });

  it("counts a claim as discussed when its project was asked about", async () => {
    const ctx = baseCtx(
      { useResume: true },
      {
        resume: {
          headline: "",
          summary: "",
          totalExperienceYears: 1,
          skills: [],
          strongAreas: [],
          weakAreas: [],
          projects: [{ name: "ParkEase", summary: "", technologies: [], claims: ["Designed an event pipeline with Redis Streams"] }],
          experience: [],
          claimsToVerify: [
            { claim: "Designed an event pipeline with Redis Streams", followUpQuestions: [] },
            { claim: "Reduced API latency by 40%", followUpQuestions: [] },
          ],
        },
      },
    );
    const plan = (await demoEngine.plan(ctx)).plan;
    const turns: Turn[] = [
      {
        index: 1,
        topic: "Project Walkthrough",
        action: "opening",
        question: "Walk me through ParkEase and the key technical decisions you made.",
        askedAt: new Date(),
        answer: STRONG,
        evaluation: { score: 8.5, signal: "strong", strengths: [], missing: [], note: "" },
      },
    ];
    const { claims } = await demoEngine.report(ctx, plan, turns, analyzeCommunication(turns));
    expect(claims).toEqual([
      expect.objectContaining({ claim: "Designed an event pipeline with Redis Streams", status: "verified" }),
      expect.objectContaining({ claim: "Reduced API latency by 40%", status: "not_discussed" }),
    ]);
  });
});

describe("demo memory greeting", () => {
  it("doesn't mention weak topics from other kinds of rounds", async () => {
    const ctx = baseCtx({}, { memory: { interviewsConsidered: 1, recurringWeakTopics: [{ topic: "Requirements", count: 1 }] } });
    const out = await demoEngine.plan(ctx);
    expect(out.greeting).not.toContain("Requirements");
  });
});
