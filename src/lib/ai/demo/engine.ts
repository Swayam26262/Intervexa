import { TYPE_META, type Personality } from "@/lib/interview/config";
import { topicKey } from "@/lib/interview/memory";
import { getProblem } from "@/lib/interview/coding-problems";
import { getPack } from "@/lib/interview/packs";
import { scoredTurns } from "@/lib/interview/progress";
import type {
  AnswerEvaluation,
  ClaimCheck,
  CodeReview,
  InterviewContext,
  ReportDraft,
  Signal,
  Turn,
  TurnAction,
  TurnResult,
} from "@/lib/interview/types";
import type { TurnInfo } from "@/lib/interview/progress";
import type { InterviewEngine } from "../engine";
import { heuristicEvaluate, quoteFrom } from "./heuristics";
import { buildDemoTopics, type DemoQuestion, type DemoTopic } from "./question-bank";

const ACKS: Record<Personality, Record<Signal, string[]>> = {
  friendly: {
    strong: ["Nice, that's a clear explanation.", "Great, that makes sense.", "Good — I like how you reasoned about that."],
    adequate: ["Okay, that's a good start.", "Alright, thanks.", "Good. Let's explore that a little more."],
    weak: ["Let's explore that a little more.", "Take your time with this one."],
    gap: ["No worries — let's try a slightly different angle.", "That's okay. Let's step back a little."],
    clarification: ["Sure, let me put it differently."],
  },
  professional: {
    strong: ["Okay.", "Got it.", "Understood."],
    adequate: ["Okay.", "Alright.", "Got it."],
    weak: ["Okay.", "Let me push on that."],
    gap: ["Alright, let's step back.", "Okay, let's try something more fundamental."],
    clarification: ["Sure."],
  },
  strict: {
    strong: ["Good.", "Fine."],
    adequate: ["That's only partially there.", "Okay, but go deeper."],
    weak: ["That doesn't really answer the question.", "That's vague."],
    gap: ["That's a gap. Let's try something more basic."],
    clarification: ["Listen carefully."],
  },
  faang: {
    strong: ["Good. Let's go one level deeper elsewhere.", "Makes sense."],
    adequate: ["Okay. How would that hold up at ten times the scale?", "Reasonable. Let's make it more precise."],
    weak: ["I'd like more precision there.", "Let's be concrete."],
    gap: ["Let's take a step back to fundamentals."],
    clarification: ["Let me restate it."],
  },
  startup: {
    strong: ["Nice — that's how we'd ship it.", "Good, practical answer."],
    adequate: ["Okay, but we're a small team — keep it practical.", "Fair. Let's pressure-test that."],
    weak: ["Hmm, that wouldn't survive a production incident.", "Be specific — what would you actually do?"],
    gap: ["No problem. Let's try something more hands-on."],
    clarification: ["Sure — quick rephrase."],
  },
};

/** Generic warm-up topics are not useful "weak topic" memory tags. */
const WARM_UP_TOPICS = new Set(["Project Walkthrough", "Recent Project", "Wrap-up"]);

const CLOSINGS: Record<Personality, string> = {
  friendly: "That's all the time we have — thank you, you did well to stay with the tough questions! Your detailed report is ready.",
  professional: "That's time. Thank you for your answers today. Your detailed report is ready.",
  strict: "We're out of time. Thank you. Your report is ready — review the gaps carefully.",
  faang: "That's our time. Thanks for walking me through your thinking — your detailed report is ready.",
  startup: "That's a wrap — thanks for jumping in! Your report is ready with what to sharpen next.",
};

function ack(personality: Personality, signal: Signal, seed: number): string {
  const options = ACKS[personality][signal];
  return options[seed % options.length];
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function questionsOf(topic: DemoTopic): DemoQuestion[] {
  return [topic.main, ...topic.followUps, topic.easier];
}

function wasAsked(turns: Turn[], question: DemoQuestion): boolean {
  return turns.some((t) => t.question.includes(question.text));
}

function nextTopic(topics: DemoTopic[], turns: Turn[]): { topic: string; question: DemoQuestion } | null {
  const covered = new Set(turns.map((t) => t.topic.toLowerCase()));
  const fresh = topics.find((t) => !covered.has(t.name.toLowerCase()));
  if (fresh) return { topic: fresh.name, question: fresh.main };
  const current = turns[turns.length - 1]?.topic.toLowerCase();
  for (const t of topics) {
    if (t.name.toLowerCase() === current) continue;
    const unused = t.followUps.find((f) => !wasAsked(turns, f));
    if (unused) return { topic: t.name, question: unused };
  }
  return null;
}

function greetingFor(ctx: InterviewContext, memoryLine: string): string {
  const name = firstName(ctx.candidate.name);
  const pack = getPack(ctx.config.packId);
  const round = TYPE_META[ctx.config.type].label.toLowerCase();
  if (ctx.config.drill) {
    return `Hi ${name}. This is a quick ${ctx.config.durationMinutes}-minute drill on ${ctx.config.focus ?? "your weak area"} — we'll start with the fundamentals and build up.${memoryLine}`;
  }
  const style = pack ? ` It's ${pack.label === "Startup" ? "a startup" : `an ${pack.label}`} round, so expect questions in that format.` : "";
  return `Hi ${name}. I'll be your interviewer for this ${round} round for the ${ctx.config.role} role.${style}${memoryLine}`;
}

/** Blends the explanation score with test results when code was submitted. */
function evaluateWithCode(turn: Turn, keywords: string[]): AnswerEvaluation {
  const evaluation = heuristicEvaluate(turn.answer ?? "", keywords);
  const tests = turn.code?.tests;
  if (!tests || !tests.total || evaluation.signal === "clarification") return evaluation;
  const passRatio = tests.passed / tests.total;
  const score = Math.round((evaluation.score * 0.4 + passRatio * 10 * 0.6) * 10) / 10;
  const signal = score >= 7.5 ? "strong" : score >= 5 ? "adequate" : score >= 3 ? "weak" : "gap";
  return {
    ...evaluation,
    score,
    signal,
    strengths: [...(passRatio === 1 ? ["All tests passing"] : []), ...evaluation.strengths].slice(0, 5),
    missing: [...(passRatio < 1 ? [`${tests.total - tests.passed} failing test${tests.total - tests.passed === 1 ? "" : "s"}`] : []), ...evaluation.missing].slice(0, 5),
  };
}

async function decideTurn(ctx: InterviewContext, turns: Turn[], info: TurnInfo): Promise<TurnResult> {
  const personality = ctx.config.personality;
  const last = turns[turns.length - 1];
  const topics = buildDemoTopics(ctx);
  const current = topics.find((t) => t.name.toLowerCase() === last.topic.toLowerCase());
  const currentQuestion = current ? questionsOf(current).find((q) => last.question.includes(q.text)) : undefined;
  const keywords = currentQuestion?.keywords ?? current?.main.keywords ?? [];
  const evaluation: AnswerEvaluation = evaluateWithCode(last, keywords);

  if (info.mustWrapUp) {
    return { evaluation, action: "wrap_up", topic: last.topic, message: CLOSINGS[personality] };
  }

  const seed = turns.length;
  const lead = ack(personality, evaluation.signal, seed);
  const moveOn = (): { action: TurnAction; topic: string; message: string } => {
    const next = nextTopic(topics, turns);
    if (!next) {
      return {
        action: "next_topic",
        topic: "Wrap-up",
        message: `${lead} Is there anything about your experience we haven't covered that you'd like me to know?`,
      };
    }
    return { action: "next_topic", topic: next.topic, message: `${lead} ${next.question.text}` };
  };

  let decision: { action: TurnAction; topic: string; message: string };
  if (evaluation.signal === "clarification") {
    const repeat = currentQuestion ?? current?.main;
    decision = {
      action: "clarify",
      topic: last.topic,
      message: repeat ? `${lead} ${repeat.text}` : `${lead} ${last.question}`,
    };
  } else if (!current || info.sameTopicStreak >= 3 || evaluation.signal === "strong") {
    decision = moveOn();
  } else if (evaluation.signal === "adequate") {
    const followUp = current.followUps.find((f) => !wasAsked(turns, f));
    decision = followUp
      ? { action: "follow_up", topic: current.name, message: `${lead} ${followUp.text}` }
      : moveOn();
  } else if (evaluation.signal === "weak" && last.action !== "probe") {
    const quote = quoteFrom(last.answer ?? "");
    decision = {
      action: "probe",
      topic: current.name,
      message: quote
        ? `${lead} You said "${quote}". Can you be more specific — why was that the right approach, and what trade-offs did you consider?`
        : `${lead} Can you be more specific? Walk me through a concrete example from your own work.`,
    };
  } else if (evaluation.signal === "gap" && last.action !== "easier" && !wasAsked(turns, current.easier)) {
    decision = { action: "easier", topic: current.name, message: `${lead} ${current.easier.text}` };
  } else {
    decision = moveOn();
  }

  return { evaluation, ...decision };
}

/** Offline claim verification: claims the interviewer asked about, graded by answer score. */
function demoClaims(ctx: InterviewContext, scored: Turn[]): ClaimCheck[] | undefined {
  const claims = ctx.resume?.claimsToVerify ?? [];
  if (!claims.length || !["project_deep_dive", "technical"].includes(ctx.config.type)) return undefined;
  return claims.slice(0, 6).map(({ claim }) => {
    const turn = scored.find((t) => t.question.includes(claim));
    if (!turn) return { claim, status: "not_discussed", note: "This claim didn't come up — expect it in a real interview." };
    const score = turn.evaluation!.score;
    if (score >= 7) return { claim, status: "verified", note: "You backed this up with specific, credible detail." };
    if (score >= 4.5) return { claim, status: "partial", note: "Some detail, but add numbers and your personal contribution." };
    return { claim, status: "unverified", note: "Your answer didn't support this claim — prepare a concrete walkthrough." };
  });
}

/** Offline code review from test results and the candidate's explanations. */
function demoCodeReview(ctx: InterviewContext, scored: Turn[]): CodeReview | undefined {
  const problem = getProblem(ctx.config.problemId);
  const withCode = [...scored].reverse().find((t) => t.code);
  if (!problem || !withCode?.code) return undefined;
  const code = withCode.code;
  const tests = code.tests;
  const passRatio = tests && tests.total ? tests.passed / tests.total : 0;
  const hidden = tests?.results.filter((r) => r.name.startsWith("Hidden")) ?? [];
  const hiddenRatio = hidden.length ? hidden.filter((r) => r.passed).length / hidden.length : passRatio;
  const talk = scored.map((t) => t.answer ?? "").join(" ").toLowerCase();
  const claimedTime = talk.match(/o\([^)]{1,20}\)/)?.[0]?.toUpperCase().replace(/^O/, "O") ?? null;
  const optimalTime = problem.optimal.time.toLowerCase();
  const complexityScore = claimedTime ? (claimedTime.toLowerCase() === optimalTime ? 9 : 6) : 4;
  const edgeMentions = ["empty", "duplicate", "negative", "single", "null", "zero", "large"].filter((w) => talk.includes(w)).length;
  const lines = code.source.split("\n").filter((l) => l.trim());
  const badNames = (code.source.match(/\b(?:let|const|var)\s+([a-z])\b/g) ?? []).filter((m) => !/\b[ijk]\b/.test(m)).length;
  const quality = Math.max(3, Math.min(9, 8 - badNames - (lines.length > 60 ? 2 : 0) + (/\/\/|#/.test(code.source) ? 1 : 0)));
  const explanation = scored.length ? scored.reduce((sum, t) => sum + t.evaluation!.score, 0) / scored.length : 0;
  const notes: string[] = [];
  if (passRatio < 1) notes.push(`${(tests?.total ?? 0) - (tests?.passed ?? 0)} test(s) still fail — trace them by hand before optimising.`);
  else notes.push("All tests pass, including the hidden cases.");
  if (!claimedTime) notes.push(`You didn't state the complexity. The optimal solution is ${problem.optimal.time} time, ${problem.optimal.space} space.`);
  else if (claimedTime.toLowerCase() !== optimalTime) notes.push(`You described ${claimedTime}; the optimal is ${problem.optimal.time}.`);
  if (edgeMentions < 2) notes.push("Talk through edge cases (empty input, duplicates, negatives) before you run the tests.");
  if (badNames > 0) notes.push("Use descriptive variable names — single letters make code harder to review.");
  return {
    correctness: Math.round(passRatio * 100) / 10,
    complexity: complexityScore,
    edgeCases: Math.round(Math.min(10, hiddenRatio * 7 + edgeMentions) * 10) / 10,
    codeQuality: quality,
    explanation: Math.round(explanation * 10) / 10,
    timeComplexity: claimedTime ?? "Not stated",
    spaceComplexity: problem.optimal.space,
    notes: notes.slice(0, 4),
  };
}

export const demoEngine: InterviewEngine = {
  mode: "demo",

  async plan(ctx) {
    const topics = buildDemoTopics(ctx);
    const planTopics = topics.slice(0, 6).map((t) => ({ name: t.name, reason: t.reason }));
    // Only mention remembered weak topics this round will actually revisit.
    const planned = new Set(planTopics.map((t) => topicKey(t.name)));
    const weak = (ctx.memory?.recurringWeakTopics ?? []).filter((w) => planned.has(topicKey(w.topic)));
    const memoryLine = weak.length
      ? ` ${weak[0].topic} came up as a weak spot in ${weak[0].count > 1 ? `${weak[0].count} of your recent interviews` : "a recent interview"}, so we'll revisit it today.`
      : "";
    return {
      plan: {
        focusSummary: `A ${ctx.config.durationMinutes}-minute ${TYPE_META[ctx.config.type].label.toLowerCase()} round for a ${ctx.config.role} covering ${planTopics
          .slice(0, 4)
          .map((t) => t.name)
          .join(", ")}.`,
        topics: planTopics,
        memoryNote: weak.length ? `Revisiting recurring weak areas: ${weak.map((w) => w.topic).join(", ")}` : undefined,
      },
      greeting: greetingFor(ctx, memoryLine),
      openingQuestion: topics[0].main.text,
      openingTopic: topics[0].name,
    };
  },

  async nextTurn(ctx, _plan, turns, info, onDelta) {
    const result = await decideTurn(ctx, turns, info);
    onDelta?.(result.message);
    return result;
  },

  async report(ctx, _plan, turns, communication) {
    const scored = scoredTurns(turns);
    const avg = scored.length ? scored.reduce((sum, t) => sum + t.evaluation!.score, 0) / scored.length : 0;
    const fillerPenalty = Math.min(5, communication.fillerPer100Words * 0.5);
    const overallScore = Math.round(Math.max(0, avg * 10 - fillerPenalty));

    const byTopic = new Map<string, number[]>();
    for (const t of scored) {
      byTopic.set(t.topic, [...(byTopic.get(t.topic) ?? []), t.evaluation!.score]);
    }
    const topicAvgs = [...byTopic.entries()]
      .map(([topic, scores]) => ({ topic, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
      .sort((a, b) => a.avg - b.avg);

    const mean = (list: Turn[]) =>
      list.length ? Math.round((list.reduce((s, t) => s + t.evaluation!.score, 0) / list.length) * 10) : null;
    const mainTurns = scored.filter((t) => t.action === "opening" || t.action === "next_topic");
    const deeperTurns = scored.filter((t) => ["follow_up", "probe", "easier"].includes(t.action));
    const answersText = scored.map((t) => t.answer ?? "").join(" ");
    const hedges = answersText.match(/\b(i think|maybe|probably|not sure|i guess|kind of)\b/gi)?.length ?? 0;
    const gaps = scored.filter((t) => t.evaluation!.signal === "gap").length;
    const technicalRound = ["technical", "system_design", "project_deep_dive"].includes(ctx.config.type);
    const clamp = (n: number) => Math.round(Math.min(95, Math.max(20, n)));
    const clarityBase =
      communication.avgWordsPerAnswer >= 40 && communication.avgWordsPerAnswer <= 180
        ? 80
        : communication.avgWordsPerAnswer < 40
          ? 40 + communication.avgWordsPerAnswer
          : 65;

    const categoryScores: ReportDraft["categoryScores"] = {
      technicalKnowledge: technicalRound ? (mean(mainTurns) ?? Math.round(avg * 10)) : null,
      problemSolving: ctx.config.type === "hr" ? null : (mean(deeperTurns) ?? Math.round(avg * 10)),
      communication: scored.length
        ? clamp(85 - communication.fillerPer100Words * 3 - (communication.shortAnswers / scored.length) * 25)
        : null,
      projectUnderstanding:
        ctx.config.type === "project_deep_dive" || (ctx.config.type === "technical" && ctx.resume)
          ? Math.round(avg * 10)
          : null,
      confidence: scored.length ? clamp(80 - gaps * 10 - hedges * 2) : null,
      clarity: scored.length ? clamp((clarityBase + avg * 10) / 2) : null,
    };

    const weakTopics = topicAvgs
      .filter((t) => t.avg < 5.5 && !WARM_UP_TOPICS.has(t.topic))
      .slice(0, 3)
      .map((t) => t.topic);
    const strongTopics = [...topicAvgs].reverse().filter((t) => t.avg >= 7).slice(0, 3);
    const missedTopics = [
      ...new Set(
        scored.flatMap((t) => t.evaluation!.missing).filter((m) => m !== "concrete examples or justification"),
      ),
    ].slice(0, 8);

    const strengths = [
      ...strongTopics.map((t) => `Strong grasp of ${t.topic}`),
      ...[...new Set(scored.flatMap((t) => t.evaluation!.strengths))].slice(0, 3),
    ].slice(0, 5);
    if (!strengths.length) strengths.push("Stayed engaged and attempted every question");

    const weaknesses = topicAvgs
      .filter((t) => t.avg < 5.5)
      .slice(0, 3)
      .map((t) => `${t.topic}: answers lacked depth or missed key concepts`);
    if (communication.fillerPer100Words > 3) weaknesses.push("Frequent filler words made answers harder to follow");
    if (scored.length && communication.shortAnswers / scored.length > 0.4) {
      weaknesses.push("Many answers were very short — expand with reasoning and examples");
    }
    if (!weaknesses.length) weaknesses.push("Push for more concrete numbers and trade-offs to move from good to great");

    const best = strongTopics[0]?.topic;
    const worst = weakTopics[0];
    const claims = demoClaims(ctx, scored);
    const coding = ctx.config.type === "coding" ? demoCodeReview(ctx, scored) : undefined;
    return {
      ...(claims ? { claims } : {}),
      ...(coding ? { coding } : {}),
      overallScore,
      categoryScores,
      summary: [
        `You scored ${overallScore}/100 in this ${TYPE_META[ctx.config.type].label.toLowerCase()} round across ${scored.length} answered question${scored.length === 1 ? "" : "s"}.`,
        best ? `You were strongest on ${best}.` : "",
        worst ? `Focus your next practice on ${worst}.` : "Keep adding concrete examples and trade-offs to lift your score further.",
      ]
        .filter(Boolean)
        .join(" "),
      strengths,
      weaknesses: weaknesses.slice(0, 5),
      weakTopics,
      missedTopics,
      suggestedTopics: [...new Set([...weakTopics, ...missedTopics.slice(0, 3)])].slice(0, 5),
      questions: scored.map((t) => ({
        turnIndex: t.index,
        score: t.evaluation!.score,
        didWell: t.evaluation!.strengths,
        missing: t.evaluation!.missing,
        betterAnswer: t.evaluation!.missing.length
          ? `A stronger answer would clearly cover ${t.evaluation!.missing.join(", ")}, ground it in a concrete example from your own work (what you did, why, and the measurable result), and name the main trade-off you considered.`
          : "This was a solid answer. To make it exceptional, quantify the impact and mention one trade-off or alternative you rejected.",
      })),
    };
  },
};
