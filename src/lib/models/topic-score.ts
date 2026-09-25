import mongoose, { Schema, type Model } from "mongoose";
import type { InterviewType } from "@/lib/interview/config";

/**
 * One row per (interview, topic): the analytics collection behind progress tracking,
 * topic mastery and "did I improve?" checks. Written when a report is generated.
 */
export interface TopicScoreShape {
  userId: mongoose.Types.ObjectId;
  interviewId: mongoose.Types.ObjectId;
  type: InterviewType;
  topic: string;
  topicKey: string;
  score: number;
  count: number;
  at: Date;
}

const schema = new Schema<TopicScoreShape>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  interviewId: { type: Schema.Types.ObjectId, ref: "Interview", required: true },
  type: { type: String, required: true },
  topic: { type: String, required: true },
  topicKey: { type: String, required: true },
  score: { type: Number, required: true },
  count: { type: Number, required: true },
  at: { type: Date, required: true },
});
schema.index({ userId: 1, topicKey: 1, at: -1 });
schema.index({ interviewId: 1 });

export const TopicScore: Model<TopicScoreShape> =
  (mongoose.models.TopicScore as Model<TopicScoreShape>) ?? mongoose.model<TopicScoreShape>("TopicScore", schema);
