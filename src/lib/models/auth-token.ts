import mongoose, { Schema, type Model } from "mongoose";

export type AuthTokenType = "verify_email" | "reset_password";

/** Single-use email tokens. Only a SHA-256 hash is stored; documents expire via TTL. */
export interface AuthTokenShape {
  userId: mongoose.Types.ObjectId;
  type: AuthTokenType;
  tokenHash: string;
  expiresAt: Date;
}

const schema = new Schema<AuthTokenShape>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["verify_email", "reset_password"], required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthToken: Model<AuthTokenShape> =
  (mongoose.models.AuthToken as Model<AuthTokenShape>) ?? mongoose.model<AuthTokenShape>("AuthToken", schema);
