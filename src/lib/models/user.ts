import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { DIFFICULTIES } from "@/lib/interview/config";

const profileSchema = new Schema(
  {
    currentRole: { type: String, default: "", maxlength: 120 },
    targetRole: { type: String, default: "", maxlength: 120 },
    experienceYears: { type: Number, default: 0, min: 0, max: 50 },
    location: { type: String, default: "", maxlength: 120 },
    education: { type: String, default: "", maxlength: 200 },
    skills: { type: [String], default: [] },
    preferredDifficulty: { type: String, enum: DIFFICULTIES, default: "medium" },
  },
  { _id: false },
);

const planSchema = new Schema(
  {
    /** Pro access is a time-boxed pass (bought monthly via Razorpay Orders). */
    proUntil: { type: Date },
    /** Interview credits: each one is a Pro-level interview. */
    credits: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    image: { type: String },
    provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    emailVerified: { type: Date },
    profile: { type: profileSchema, default: () => ({}) },
    plan: { type: planSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export type UserProfile = InferSchemaType<typeof profileSchema>;

export const User: Model<InferSchemaType<typeof userSchema>> =
  mongoose.models.User ?? mongoose.model("User", userSchema);
