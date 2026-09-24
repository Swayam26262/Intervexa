import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { ResumeAnalysis } from "@/lib/interview/types";

const resumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    text: { type: String, required: true, select: false },
    // Validated with zod before saving; stored as a plain object.
    analysis: { type: Schema.Types.Mixed, required: true },
    aiMode: { type: String, enum: ["gemini", "demo"], required: true },
  },
  { timestamps: true },
);

export type ResumeDoc = Omit<InferSchemaType<typeof resumeSchema>, "analysis"> & {
  _id: mongoose.Types.ObjectId;
  analysis: ResumeAnalysis;
};

export const Resume: Model<InferSchemaType<typeof resumeSchema>> =
  mongoose.models.Resume ?? mongoose.model("Resume", resumeSchema);
