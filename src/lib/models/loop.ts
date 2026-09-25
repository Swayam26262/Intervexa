import mongoose, { Schema, type Model } from "mongoose";
import type { Difficulty, InterviewType } from "@/lib/interview/config";
import type { JdAnalysis } from "@/lib/interview/types";

export interface LoopRound {
  title: string;
  type: InterviewType;
  focus: string;
  durationMinutes: number;
  interviewId?: mongoose.Types.ObjectId;
  status: "pending" | "in_progress" | "completed";
  score?: number;
}

export interface ReadinessReport {
  overall: number;
  summary: string;
  skills: { name: string; level: "strong" | "moderate" | "weak"; evidence: string }[];
  nextSteps: string[];
  generatedAt: Date;
}

/** A full mock interview loop built from a real job description. */
export interface LoopShape {
  userId: mongoose.Types.ObjectId;
  title: string;
  company?: string;
  packId?: string;
  role: string;
  difficulty: Difficulty;
  jobDescription: string;
  jd: JdAnalysis;
  rounds: LoopRound[];
  status: "active" | "completed";
  readiness?: ReadinessReport;
  createdAt: Date;
  updatedAt: Date;
}

export type LoopDoc = LoopShape & { _id: mongoose.Types.ObjectId };

const roundSchema = new Schema<LoopRound>(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    focus: { type: String, default: "" },
    durationMinutes: { type: Number, required: true },
    interviewId: { type: Schema.Types.ObjectId, ref: "Interview" },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
    score: { type: Number },
  },
  { _id: false },
);

const schema = new Schema<LoopShape>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    company: { type: String, maxlength: 120 },
    packId: { type: String },
    role: { type: String, required: true, maxlength: 120 },
    difficulty: { type: String, required: true },
    jobDescription: { type: String, required: true, maxlength: 12000 },
    jd: { type: Schema.Types.Mixed, required: true },
    rounds: { type: [roundSchema], default: [] },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    readiness: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Loop: Model<LoopShape> =
  (mongoose.models.Loop as Model<LoopShape>) ?? mongoose.model<LoopShape>("Loop", schema);
