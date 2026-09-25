import mongoose from "mongoose";
import { analyzeCommunication } from "@/lib/analysis/communication";
import { currentAiMode, getEngine } from "@/lib/ai/engine";
import { analyzeJobDescription } from "@/lib/ai/jd-analyzer";
import { consumeCredit, getEntitlements, refundCredit } from "@/lib/billing/service";
import { FEATURES, type Feature } from "@/lib/billing/plans";
import { connectDB } from "@/lib/db";
import { getProblem, pickProblem } from "@/lib/interview/coding-problems";
import type { AnswerMode } from "@/lib/interview/config";
import { topicKey } from "@/lib/interview/memory";
import { getPack } from "@/lib/interview/packs";
import { normalizeReport, scoredTurns, turnInfo } from "@/lib/interview/progress";
import type {
  CodeSubmission,
  InterviewConfig,
  InterviewContext,
  InterviewReport,
  JdAnalysis,
  SpeechMetrics,
  TopicImprovement,
  Turn,
} from "@/lib/interview/types";
import { Interview, type BillingSource, type InterviewContextSnapshot, type InterviewDoc } from "@/lib/models/interview";
import { TopicScore } from "@/lib/models/topic-score";
import { logger } from "@/lib/platform/logger";
import { getActiveResume, getInterview, getMemory, getUser } from "./data";

export class ServiceError extends Error {
  constructor(
    message: string,
    public status: 400 | 402 | 403 | 404 | 409,
    public code?: string,
  ) {
    super(message);
  }
}

function contextOf(interview: Pick<InterviewDoc, "config" | "context">): InterviewContext {
  return { ...interview.context, config: interview.config };
}

function requiredFeatures(config: InterviewConfig): Feature[] {
  const needs: Feature[] = [];
  if (config.answerMode === "voice") needs.push("voice");
  if (config.jobDescription?.trim()) needs.push("jd");
  if (config.packId) needs.push("packs");
  if (config.type === "coding") needs.push("coding");
  if (config.drill) needs.push("drills");
  if (config.loopId) needs.push("loops");
  if (config.language && config.language !== "en") needs.push("languages");
  return needs;
}

export interface StartOptions {
  /** JD analysis already computed (e.g. by the setup page preview or a mock loop). */
  jdAnalysis?: JdAnalysis;
}

export async function startInterview(userId: string, input: InterviewConfig, options: StartOptions = {}): Promise<string> {
  const user = await getUser(userId);
  if (!user) throw new ServiceError("User not found", 404);

  const entitlements = await getEntitlements(userId);
  if (!entitlements.nextSource) {
    throw new ServiceError(
      `You've used your ${entitlements.freeLimit} free interviews this month. Upgrade to Pro or add interview credits to keep practising.`,
      402,
      "quota",
    );
  }
  const locked = requiredFeatures(input).filter((f) => !entitlements.features[f]);
  if (locked.length) {
    throw new ServiceError(`${FEATURES[locked[0]]} ${locked.length > 1 ? "and more are" : "is"} part of Pro.`, 402, "feature");
  }

  // Normalise the config.
  const config: InterviewConfig = { ...input, language: input.language ?? "en" };
  if (config.packId && !getPack(config.packId)) config.packId = undefined;
  if (config.type === "coding") {
    config.problemId = getProblem(config.problemId)?.id ?? pickProblem(config.difficulty, `${userId}:${Date.now()}`).id;
    config.codeLanguage = config.codeLanguage ?? "javascript";
  } else {
    config.problemId = undefined;
    config.codeLanguage = undefined;
  }

  const [resume, memory] = await Promise.all([
    config.useResume ? getActiveResume(userId) : Promise.resolve(null),
    config.drill ? Promise.resolve(null) : getMemory(userId, config.type),
  ]);

  let jd = options.jdAnalysis;
  if (!jd && config.jobDescription?.trim()) {
    jd = await analyzeJobDescription(config.jobDescription, { profileSkills: user.profile?.skills ?? [], resume: resume?.analysis });
  }

  const snapshot: InterviewContextSnapshot = {
    candidate: {
      name: user.name,
      currentRole: user.profile?.currentRole || undefined,
      targetRole: user.profile?.targetRole || undefined,
      experienceYears: user.profile?.experienceYears ?? undefined,
      education: user.profile?.education || undefined,
      skills: user.profile?.skills ?? [],
    },
    resume: resume?.analysis,
    memory: memory && memory.interviewsConsidered > 0 ? memory : undefined,
    jd,
  };
  const effectiveConfig: InterviewConfig = { ...config, useResume: Boolean(resume) };
  const ctx: InterviewContext = { ...snapshot, config: effectiveConfig };

  // Meter usage: credits are spent first (they carry Pro features), then the free quota.
  let billing: BillingSource = entitlements.nextSource === "credit" ? "credit" : entitlements.nextSource;
  if (billing === "credit" && !(await consumeCredit(userId))) {
    if (entitlements.freeUsed < entitlements.freeLimit && !locked.length) billing = "free";
    else throw new ServiceError("You're out of interview credits.", 402, "quota");
  }

  const mode = currentAiMode();
  let planned;
  try {
    planned = await getEngine(mode).plan(ctx);
  } catch (error) {
    if (billing === "credit") await refundCredit(userId);
    throw error;
  }
  const now = new Date();

  await connectDB();
  const doc = await Interview.create({
    userId,
    status: "in_progress",
    aiMode: mode,
    billing,
    config: effectiveConfig,
    context: snapshot,
    plan: planned.plan,
    greeting: planned.greeting,
    turns: [{ index: 1, topic: planned.openingTopic, action: "opening", question: planned.openingQuestion, askedAt: now }],
    startedAt: now,
  });
  return doc._id.toString();
}

export interface AnswerInput {
  answer: string;
  turnIndex?: number;
  durationSec?: number;
  inputMode: AnswerMode;
  code?: CodeSubmission;
  diagram?: { summary: string };
  speech?: SpeechMetrics;
}

export interface AnswerOutcome {
  done: boolean;
  message: string;
  turn?: Pick<Turn, "index" | "topic" | "action" | "question">;
}

export async function submitAnswer(
  userId: string,
  id: string,
  input: AnswerInput,
  onDelta?: (text: string) => void,
): Promise<AnswerOutcome> {
  const interview = await getInterview(userId, id);
  if (!interview) throw new ServiceError("Interview not found", 404);
  if (interview.status !== "in_progress" || interview.closing) {
    throw new ServiceError("This interview has already finished", 409);
  }
  const lastIdx = interview.turns.length - 1;
  const last = interview.turns[lastIdx];
  if (!last || last.answer !== undefined || (input.turnIndex !== undefined && input.turnIndex !== last.index)) {
    throw new ServiceError("This question was already answered", 409);
  }

  const now = new Date();
  const answered: Turn = {
    ...last,
    answer: input.answer,
    answeredAt: now,
    answerDurationSec: input.durationSec,
    inputMode: input.inputMode,
    ...(input.code ? { code: input.code } : {}),
    ...(input.diagram?.summary ? { diagram: input.diagram } : {}),
    ...(input.speech ? { speech: input.speech } : {}),
  };
  const turns = [...interview.turns.slice(0, lastIdx), answered];
  const info = turnInfo(turns, interview.startedAt, interview.config.durationMinutes, now, interview.config.type);

  const result = await getEngine(interview.aiMode).nextTurn(contextOf(interview), interview.plan, turns, info, onDelta);
  const done = result.action === "wrap_up";
  const nextTurn: Turn | undefined = done
    ? undefined
    : { index: last.index + 1, topic: result.topic, action: result.action, question: result.message, askedAt: new Date() };

  // One atomic $set: the answered turn at its index and the next question right after it.
  // (MongoDB rejects $set on turns.N.* combined with $push to turns in a single update.)
  const answeredWithEval: Turn = { ...answered, evaluation: result.evaluation };
  if (answeredWithEval.answerDurationSec === undefined) delete answeredWithEval.answerDurationSec;
  const update = {
    $set: {
      [`turns.${lastIdx}`]: answeredWithEval,
      ...(nextTurn ? { [`turns.${lastIdx + 1}`]: nextTurn } : {}),
      ...(done ? { closing: result.message } : {}),
    },
  };

  await connectDB();
  // Conditional update: guards against double submits and answers after the interview ended.
  const res = await Interview.updateOne(
    {
      _id: id,
      userId,
      status: "in_progress",
      [`turns.${lastIdx}.answer`]: { $exists: false },
      [`turns.${lastIdx + 1}`]: { $exists: false },
    },
    update,
  );
  if (res.matchedCount === 0) throw new ServiceError("This question was already answered", 409);

  return {
    done,
    message: result.message,
    turn: nextTurn && { index: nextTurn.index, topic: nextTurn.topic, action: nextTurn.action, question: nextTurn.question },
  };
}

export type FinishOutcome = { status: "completed"; generateReport: boolean } | { status: "discarded" };

/**
 * Ends the interview. The report is generated separately (in the background) so ending feels
 * instant; the report page shows progress until it's ready.
 */
export async function finishInterview(userId: string, id: string): Promise<FinishOutcome> {
  const interview = await getInterview(userId, id);
  if (!interview) throw new ServiceError("Interview not found", 404);
  if (interview.status === "completed") {
    return { status: "completed", generateReport: interview.reportStatus !== "ready" && interview.reportStatus !== "pending" };
  }

  await connectDB();
  const answeredTurns = interview.turns.filter((t) => t.answer !== undefined && t.evaluation);
  if (scoredTurns(answeredTurns).length === 0) {
    // Nothing to report on: discard instead of saving an empty 0/100 report, and refund a credit.
    const res = await Interview.deleteOne({ _id: id, userId, status: "in_progress" });
    if (res.deletedCount && interview.billing === "credit") await refundCredit(userId);
    return { status: "discarded" };
  }

  const res = await Interview.updateOne(
    { _id: id, userId, status: "in_progress" },
    { $set: { status: "completed", reportStatus: "pending", endedAt: new Date() } },
  );
  return { status: "completed", generateReport: res.modifiedCount === 1 };
}

function topicScoresOf(turns: Turn[], drill: boolean) {
  const byTopic = new Map<string, { topic: string; scores: number[] }>();
  for (const t of scoredTurns(turns)) {
    const topic = drill ? t.topic.split(":")[0].trim() : t.topic;
    const key = topicKey(topic);
    const entry = byTopic.get(key) ?? { topic, scores: [] };
    entry.scores.push(t.evaluation!.score);
    byTopic.set(key, entry);
  }
  return [...byTopic.entries()].map(([key, { topic, scores }]) => ({
    key,
    topic,
    score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    count: scores.length,
  }));
}

/** Compares this interview's scores on remembered weak topics with the candidate's history. */
async function improvementFor(
  userId: string,
  interview: InterviewDoc,
  topicScores: { key: string; topic: string; score: number }[],
): Promise<TopicImprovement[]> {
  const targets = [
    ...(interview.context.memory?.recurringWeakTopics.map((t) => t.topic) ?? []),
    ...(interview.config.drill && interview.config.focus ? [interview.config.focus] : []),
  ];
  const out: TopicImprovement[] = [];
  for (const target of targets) {
    const key = topicKey(target);
    const now = topicScores.find((t) => t.key === key || t.key.includes(key) || key.includes(t.key));
    if (!now) continue;
    const previous = await TopicScore.find({
      userId,
      topicKey: now.key,
      interviewId: { $ne: interview._id },
      at: { $lt: interview.startedAt },
    })
      .sort({ at: -1 })
      .limit(3)
      .lean();
    if (!previous.length) continue;
    const before = Math.round((previous.reduce((s, p) => s + p.score, 0) / previous.length) * 10) / 10;
    if (!out.some((o) => o.topic === now.topic)) out.push({ topic: now.topic, before, after: now.score });
  }
  return out;
}

/** Generates (or regenerates) the report. Safe to call more than once. */
export async function generateReport(userId: string, id: string): Promise<void> {
  const interview = await getInterview(userId, id);
  if (!interview || interview.status !== "completed" || interview.reportStatus === "ready") return;
  const answeredTurns = interview.turns.filter((t) => t.answer !== undefined && t.evaluation);
  const started = Date.now();
  try {
    const communication = analyzeCommunication(answeredTurns, {
      star: interview.config.type === "behavioral" || interview.config.type === "hr",
    });
    const draft = await getEngine(interview.aiMode).report(contextOf(interview), interview.plan, answeredTurns, communication);
    const topicScores = topicScoresOf(answeredTurns, Boolean(interview.config.drill));
    const improvement = await improvementFor(userId, interview, topicScores);
    const report: InterviewReport = {
      ...normalizeReport(draft, answeredTurns),
      communication,
      improvement,
      topicScores: topicScores.map(({ topic, score, count }) => ({ topic, score, count })),
      generatedAt: new Date(),
    };

    await connectDB();
    const at = interview.endedAt ?? new Date();
    await TopicScore.deleteMany({ interviewId: interview._id });
    if (topicScores.length) {
      await TopicScore.insertMany(
        topicScores.map((t) => ({
          userId: new mongoose.Types.ObjectId(userId),
          interviewId: interview._id,
          type: interview.config.type,
          topic: t.topic,
          topicKey: t.key,
          score: t.score,
          count: t.count,
          at,
        })),
      );
    }
    await Interview.updateOne({ _id: id, userId }, { $set: { report, reportStatus: "ready" } });
    logger.info("report generated", { interviewId: id, ms: Date.now() - started, aiMode: interview.aiMode });

    if (interview.config.loopId) {
      const { onLoopRoundCompleted } = await import("./loop-service");
      await onLoopRoundCompleted(userId, String(interview.config.loopId), id, report.overallScore);
    }
  } catch (error) {
    logger.error("report generation failed", { interviewId: id, error });
    await Interview.updateOne({ _id: id, userId, reportStatus: { $ne: "ready" } }, { $set: { reportStatus: "failed" } });
  }
}
