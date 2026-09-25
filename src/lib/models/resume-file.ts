import mongoose, { Schema, type Model } from "mongoose";

export interface ResumeFileShape {
  userId: mongoose.Types.ObjectId;
  /** AES-256-GCM encrypted file bytes (5 MB max before encryption). */
  data: Buffer;
  createdAt: Date;
}

const schema = new Schema<ResumeFileShape>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ResumeFile: Model<ResumeFileShape> =
  (mongoose.models.ResumeFile as Model<ResumeFileShape>) ?? mongoose.model<ResumeFileShape>("ResumeFile", schema);
