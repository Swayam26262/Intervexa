import mongoose, { Schema, type Model } from "mongoose";
import {
  ANSWER_MODES,
  DIFFICULTIES,
  INTERVIEW_TYPES,
  LANGUAGE_CODES,
  PERSONALITIES,
} from "@/lib/interview/config";
import type { AiMode } from "@/lib/ai/engine";
import type {
  CandidateContext,
  CandidateMemory,
  InterviewConfig,
  InterviewPlan,
  InterviewReport,
  JdAnalysis,
  ResumeAnalysis,
  Turn,
} from "@/lib/interview/types";

/** Snapshot of what the interviewer knew at the start, so every turn uses the same context. */
export interface InterviewContextSnapshot {
  candidate: CandidateContext;
  resume?: ResumeAnalysis;
  memory?: CandidateMemory;
  jd?: JdAnalysis;
}

export type InterviewStatus = "in_progress" | "completed";
export type ReportStatus = "pending" | "ready" | "failed";
/** How the interview was paid for (billing metering). */
export type BillingSource = "free" | "credit" | "pro" | "unlimited";

export interface InterviewShape {
  userId: mongoose.Types.ObjectId;
  status: InterviewStatus;
  aiMode: AiMode;
  config: InterviewConfig;
  context: InterviewContextSnapshot;
  plan: InterviewPlan;
  greeting: string;
  closing?: string;
  turns: Turn[];
  report?: InterviewReport;
  reportStatus?: ReportStatus;
  billing?: BillingSource;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewDoc = InterviewShape & { _id: mongoose.Types.ObjectId };

const configSchema = new Schema<InterviewConfig>(
  {
    role: { type: String, required: true, maxlength: 120 },
    experienceYears: { type: Number, required: true, min: 0, max: 50 },
    type: { type: String, enum: INTERVIEW_TYPES, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    durationMinutes: { type: Number, required: true },
    personality: { type: String, enum: PERSONALITIES, required: true },
    answerMode: { type: String, enum: ANSWER_MODES, required: true },
    useResume: { type: Boolean, default: false },
    jobDescription: { type: String, maxlength: 12000 },
    focus: { type: String, maxlength: 200 },
    language: { type: String, enum: LANGUAGE_CODES, default: "en" },
    packId: { type: String },
    drill: { type: Boolean },
    problemId: { type: String },
    codeLanguage: { type: String, enum: ["javascript", "python"] },
    loopId: { type: Schema.Types.ObjectId, ref: "Loop" },
    roundIndex: { type: Number },
  },
  { _id: false },
);

const turnSchema = new Schema<Turn>(
  {
    index: { type: Number, required: true },
    topic: { type: String, required: true },
    action: { type: String, required: true },
    question: { type: String, required: true },
    askedAt: { type: Date, required: true },
    answer: { type: String },
    answeredAt: { type: Date },
    answerDurationSec: { type: Number },
    inputMode: { type: String, enum: ANSWER_MODES },
    evaluation: { type: Schema.Types.Mixed },
    code: { type: Schema.Types.Mixed },
    diagram: { type: Schema.Types.Mixed },
    speech: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const interviewSchema = new Schema<InterviewShape>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress", index: true },
    aiMode: { type: String, required: true },
    config: { type: configSchema, required: true },
    context: { type: Schema.Types.Mixed, required: true },
    plan: { type: Schema.Types.Mixed, required: true },
    greeting: { type: String, default: "" },
    closing: { type: String },
    turns: { type: [turnSchema], default: [] },
    report: { type: Schema.Types.Mixed },
    reportStatus: { type: String, enum: ["pending", "ready", "failed"] },
    billing: { type: String, enum: ["free", "credit", "pro", "unlimited"] },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

interviewSchema.index({ userId: 1, createdAt: -1 });

export const Interview: Model<InterviewShape> =
  (mongoose.models.Interview as Model<InterviewShape>) ?? mongoose.model<InterviewShape>("Interview", interviewSchema);
