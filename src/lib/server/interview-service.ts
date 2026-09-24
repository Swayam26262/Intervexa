import { analyzeCommunication } from "@/lib/analysis/communication";
import { currentAiMode, getEngine } from "@/lib/ai/engine";
import { connectDB } from "@/lib/db";
import { normalizeReport, scoredTurns, turnInfo } from "@/lib/interview/progress";
import type {
  AnswerMode,
} from "@/lib/interview/config";
import type {
  InterviewConfig,
  InterviewContext,
  InterviewReport,
  Turn,
} from "@/lib/interview/types";
import { Interview, type InterviewContextSnapshot, type InterviewDoc } from "@/lib/models/interview";
import { getInterview, getLatestResume, getMemory, getUser } from "./data";

export class ServiceError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 | 409,
  ) {
    super(message);
  }
}

function contextOf(interview: Pick<InterviewDoc, "config" | "context">): InterviewContext {
  return { ...interview.context, config: interview.config };
}

export async function startInterview(userId: string, config: InterviewConfig): Promise<string> {
  const user = await getUser(userId);
  if (!user) throw new ServiceError("User not found", 404);

  const [resume, memory] = await Promise.all([
    config.useResume ? getLatestResume(userId) : Promise.resolve(null),
    getMemory(userId),
  ]);

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
    memory: memory.interviewsConsidered > 0 ? memory : undefined,
  };
  const effectiveConfig: InterviewConfig = { ...config, useResume: Boolean(resume) };
  const ctx: InterviewContext = { ...snapshot, config: effectiveConfig };

  const mode = currentAiMode();
  const planned = await getEngine(mode).plan(ctx);
  const now = new Date();

  await connectDB();
  const doc = await Interview.create({
    userId,
    status: "in_progress",
    aiMode: mode,
    config: effectiveConfig,
    context: snapshot,
    plan: planned.plan,
    greeting: planned.greeting,
    turns: [
      {
        index: 1,
        topic: planned.openingTopic,
        action: "opening",
        question: planned.openingQuestion,
        askedAt: now,
      },
    ],
    startedAt: now,
  });
  return doc._id.toString();
}

export interface AnswerInput {
  answer: string;
  durationSec?: number;
  inputMode: AnswerMode;
}

export interface AnswerOutcome {
  done: boolean;
  message: string;
  turn?: Pick<Turn, "index" | "topic" | "action" | "question">;
}

export async function submitAnswer(userId: string, id: string, input: AnswerInput): Promise<AnswerOutcome> {
  const interview = await getInterview(userId, id);
  if (!interview) throw new ServiceError("Interview not found", 404);
  if (interview.status !== "in_progress" || interview.closing) {
    throw new ServiceError("This interview has already finished", 409);
  }
  const lastIdx = interview.turns.length - 1;
  const last = interview.turns[lastIdx];
  if (!last || last.answer !== undefined) {
    throw new ServiceError("This question was already answered", 409);
  }

  const now = new Date();
  const answered: Turn = {
    ...last,
    answer: input.answer,
    answeredAt: now,
    answerDurationSec: input.durationSec,
    inputMode: input.inputMode,
  };
  const turns = [...interview.turns.slice(0, lastIdx), answered];
  const info = turnInfo(turns, interview.startedAt, interview.config.durationMinutes, now);

  const result = await getEngine(interview.aiMode).nextTurn(contextOf(interview), interview.plan, turns, info);
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
    turn: nextTurn && {
      index: nextTurn.index,
      topic: nextTurn.topic,
      action: nextTurn.action,
      question: nextTurn.question,
    },
  };
}

export type FinishOutcome = { status: "completed" } | { status: "discarded" };

export async function finishInterview(userId: string, id: string): Promise<FinishOutcome> {
  const interview = await getInterview(userId, id);
  if (!interview) throw new ServiceError("Interview not found", 404);
  if (interview.status === "completed") return { status: "completed" };

  const answeredTurns = interview.turns.filter((t) => t.answer !== undefined && t.evaluation);
  await connectDB();

  if (scoredTurns(answeredTurns).length === 0) {
    // Nothing to report on: discard instead of saving an empty 0/100 report.
    await Interview.deleteOne({ _id: id, userId, status: "in_progress" });
    return { status: "discarded" };
  }

  const communication = analyzeCommunication(answeredTurns);
  const draft = await getEngine(interview.aiMode).report(
    contextOf(interview),
    interview.plan,
    answeredTurns,
    communication,
  );
  const report: InterviewReport = {
    ...normalizeReport(draft, answeredTurns),
    communication,
    generatedAt: new Date(),
  };

  // If another request completed it first, keep that report.
  await Interview.updateOne(
    { _id: id, userId, status: "in_progress" },
    { $set: { status: "completed", report, endedAt: new Date() } },
  );
  return { status: "completed" };
}
