import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { buildMemory, MEMORY_WINDOW } from "@/lib/interview/memory";
import type { CandidateMemory, InterviewReport } from "@/lib/interview/types";
import { Interview, type InterviewDoc } from "@/lib/models/interview";
import { Resume, type ResumeDoc } from "@/lib/models/resume";
import { User, type UserDoc } from "@/lib/models/user";

export async function getUser(userId: string): Promise<UserDoc | null> {
  await connectDB();
  return User.findById(userId).lean<UserDoc>();
}

export async function getLatestResume(userId: string): Promise<ResumeDoc | null> {
  await connectDB();
  return Resume.findOne({ userId }).sort({ createdAt: -1 }).lean<ResumeDoc>();
}

export async function getInterview(userId: string, id: string): Promise<InterviewDoc | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  return Interview.findOne({ _id: id, userId }).lean<InterviewDoc>();
}

export async function listInterviews(userId: string, limit = 10): Promise<InterviewDoc[]> {
  await connectDB();
  return Interview.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select({ config: 1, status: 1, "report.overallScore": 1, createdAt: 1, startedAt: 1, endedAt: 1, aiMode: 1 })
    .lean<InterviewDoc[]>();
}

export async function getMemory(userId: string): Promise<CandidateMemory> {
  await connectDB();
  const recent = await Interview.find({ userId, status: "completed", report: { $exists: true } })
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
