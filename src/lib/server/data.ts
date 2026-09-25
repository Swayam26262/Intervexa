import mongoose, { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import type { InterviewType } from "@/lib/interview/config";
import { buildMemory, MEMORY_WINDOW } from "@/lib/interview/memory";
import type { CandidateMemory, CategoryKey, InterviewReport } from "@/lib/interview/types";
import { Interview, type InterviewDoc } from "@/lib/models/interview";
import { Loop, type LoopDoc } from "@/lib/models/loop";
import { Resume, type ResumeDoc } from "@/lib/models/resume";
import { TopicScore } from "@/lib/models/topic-score";
import { User, type UserDoc } from "@/lib/models/user";

export async function getUser(userId: string): Promise<UserDoc | null> {
  await connectDB();
  return User.findById(userId).lean<UserDoc>();
}

/** The resume interviews use: the active one, else the newest. */
export async function getActiveResume(userId: string): Promise<ResumeDoc | null> {
  await connectDB();
  return (
    (await Resume.findOne({ userId, isActive: { $ne: false } }).sort({ createdAt: -1 }).lean<ResumeDoc>()) ??
    Resume.findOne({ userId }).sort({ createdAt: -1 }).lean<ResumeDoc>()
  );
}
/** @deprecated use getActiveResume */
export const getLatestResume = getActiveResume;

export async function listResumes(userId: string): Promise<ResumeDoc[]> {
  await connectDB();
  return Resume.find({ userId }).sort({ createdAt: -1 }).lean<ResumeDoc[]>();
}

export async function getInterview(userId: string, id: string): Promise<InterviewDoc | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  return Interview.findOne({ _id: id, userId }).lean<InterviewDoc>();
}

const LIST_FIELDS = {
  config: 1,
  status: 1,
  reportStatus: 1,
  "report.overallScore": 1,
  createdAt: 1,
  startedAt: 1,
  endedAt: 1,
  aiMode: 1,
  "turns.topic": 1,
} as const;

export async function listInterviews(userId: string, limit = 10): Promise<InterviewDoc[]> {
  await connectDB();
  return Interview.find({ userId }).sort({ createdAt: -1 }).limit(limit).select(LIST_FIELDS).lean<InterviewDoc[]>();
}

export interface HistoryQuery {
  q?: string;
  type?: InterviewType;
  status?: "completed" | "in_progress";
  sort?: "newest" | "oldest" | "score_high" | "score_low";
  page?: number;
  pageSize?: number;
}

export async function searchInterviews(userId: string, query: HistoryQuery) {
  await connectDB();
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
  if (query.type) filter["config.type"] = query.type;
  if (query.status) filter.status = query.status;
  if (query.q?.trim()) {
    const re = new RegExp(query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ "config.role": re }, { "config.focus": re }, { "turns.topic": re }, { "report.weakTopics": re }];
  }
  const sort: Record<string, 1 | -1> =
    query.sort === "oldest"
      ? { createdAt: 1 }
      : query.sort === "score_high"
        ? { "report.overallScore": -1, createdAt: -1 }
        : query.sort === "score_low"
          ? { "report.overallScore": 1, createdAt: -1 }
          : { createdAt: -1 };
  const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 12));
  const page = Math.max(1, query.page ?? 1);
  const [items, total] = await Promise.all([
    Interview.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize).select(LIST_FIELDS).lean<InterviewDoc[]>(),
    Interview.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/**
 * What Intervexa remembers. With `type`, only interviews of that round type count, so a weak
 * system-design topic doesn't hijack an HR round.
 */
export async function getMemory(userId: string, type?: InterviewType): Promise<CandidateMemory> {
  await connectDB();
  const recent = await Interview.find({
    userId,
    status: "completed",
    report: { $exists: true },
    "config.drill": { $ne: true },
    ...(type ? { "config.type": type } : {}),
  })
    .sort({ endedAt: -1 })
    .limit(MEMORY_WINDOW)
    .select({ "report.weakTopics": 1, "report.overallScore": 1 })
    .lean<{ report: Pick<InterviewReport, "weakTopics" | "overallScore"> }[]>();
  return buildMemory(recent.map((r) => r.report));
}

export async function getStats(userId: string) {
  await connectDB();
  const completed = await Interview.find({ userId, status: "completed", report: { $exists: true } })
    .sort({ endedAt: -1 })
    .select({ "report.overallScore": 1 })
    .lean<{ report: { overallScore: number } }[]>();
  const recentScores = completed.slice(0, 5).map((i) => i.report.overallScore);
  return {
    completedCount: completed.length,
    averageScore: recentScores.length
      ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
      : null,
  };
}

export interface ProgressPoint {
  id: string;
  at: Date;
  type: InterviewType;
  role: string;
  drill: boolean;
  score: number;
  categories: Record<CategoryKey, number | null>;
  wpm: number | null;
  fillerRate: number;
}

/** Completed interviews (oldest first) for trend charts, streaks and badges. */
export async function getProgressPoints(userId: string): Promise<ProgressPoint[]> {
  await connectDB();
  const docs = await Interview.find({ userId, status: "completed", report: { $exists: true } })
    .sort({ endedAt: 1 })
    .select({
      config: 1,
      endedAt: 1,
      createdAt: 1,
      "report.overallScore": 1,
      "report.categoryScores": 1,
      "report.communication.wordsPerMinute": 1,
      "report.communication.fillerPer100Words": 1,
    })
    .lean<InterviewDoc[]>();
  return docs.map((d) => ({
    id: String(d._id),
    at: d.endedAt ?? d.createdAt,
    type: d.config.type,
    role: d.config.role,
    drill: Boolean(d.config.drill),
    score: d.report!.overallScore,
    categories: d.report!.categoryScores,
    wpm: d.report!.communication?.wordsPerMinute ?? null,
    fillerRate: d.report!.communication?.fillerPer100Words ?? 0,
  }));
}

export interface TopicMastery {
  topic: string;
  latest: number;
  first: number;
  average: number;
  attempts: number;
  lastAt: Date;
}

/** Per-topic scores across interviews (from the topicscores analytics collection). */
export async function getTopicMastery(userId: string): Promise<TopicMastery[]> {
  await connectDB();
  const rows = await TopicScore.aggregate<{
    _id: string;
    topic: string;
    scores: { score: number; at: Date }[];
  }>([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $sort: { at: 1 } },
    { $group: { _id: "$topicKey", topic: { $last: "$topic" }, scores: { $push: { score: "$score", at: "$at" } } } },
  ]);
  return rows
    .map((r) => ({
      topic: r.topic,
      first: r.scores[0].score,
      latest: r.scores[r.scores.length - 1].score,
      average: Math.round((r.scores.reduce((s, x) => s + x.score, 0) / r.scores.length) * 10) / 10,
      attempts: r.scores.length,
      lastAt: r.scores[r.scores.length - 1].at,
    }))
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export async function listLoops(userId: string): Promise<LoopDoc[]> {
  await connectDB();
  return Loop.find({ userId }).sort({ createdAt: -1 }).lean<LoopDoc[]>();
}

export async function getLoop(userId: string, id: string): Promise<LoopDoc | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  return Loop.findOne({ _id: id, userId }).lean<LoopDoc>();
}
