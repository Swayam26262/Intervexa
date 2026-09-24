import { TYPE_META, type Personality } from "@/lib/interview/config";
import { topicKey } from "@/lib/interview/memory";
import { scoredTurns } from "@/lib/interview/progress";
import type {
  AnswerEvaluation,
  ReportDraft,
  Signal,
  Turn,
  TurnAction,
} from "@/lib/interview/types";
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
};

/** Generic warm-up topics are not useful "weak topic" memory tags. */
const WARM_UP_TOPICS = new Set(["Project Walkthrough", "Recent Project", "Wrap-up"]);

const CLOSINGS: Record<Personality, string> = {
  friendly: "That's all the time we have — thank you, you did well to stay with the tough questions! Your detailed report is ready.",
  professional: "That's time. Thank you for your answers today. Your detailed report is ready.",
  strict: "We're out of time. Thank you. Your report is ready — review the gaps carefully.",
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
      greeting: `Hi ${firstName(ctx.candidate.name)}. I'll be your interviewer for this ${TYPE_META[ctx.config.type].label.toLowerCase()} round for the ${ctx.config.role} role.${memoryLine}`,
      openingQuestion: topics[0].main.text,
      openingTopic: topics[0].name,
    };
  },

  async nextTurn(ctx, plan, turns, info) {
    const personality = ctx.config.personality;
    const last = turns[turns.length - 1];
    const topics = buildDemoTopics(ctx);
    const current = topics.find((t) => t.name.toLowerCase() === last.topic.toLowerCase());
    const currentQuestion = current ? questionsOf(current).find((q) => last.question.includes(q.text)) : undefined;
    const keywords = currentQuestion?.keywords ?? current?.main.keywords ?? [];
    const evaluation: AnswerEvaluation = heuristicEvaluate(last.answer ?? "", keywords);

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
    return {
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
