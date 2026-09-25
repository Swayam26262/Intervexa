/**
 * Fixed-window rate limiter backed by MongoDB (no Redis needed). Each window is one
 * document with a TTL index, incremented atomically with an upsert.
 */
import mongoose, { Schema, type Model } from "mongoose";
import { connectDB } from "@/lib/db";

interface RateLimitShape {
  key: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
}

const schema = new Schema<RateLimitShape>({
  key: { type: String, required: true },
  windowStart: { type: Date, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
schema.index({ key: 1, windowStart: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit: Model<RateLimitShape> =
  (mongoose.models.RateLimit as Model<RateLimitShape>) ?? mongoose.model<RateLimitShape>("RateLimit", schema);

export interface RateLimitRule {
  /** Bucket name, e.g. "answer". */
  name: string;
  limit: number;
  windowSec: number;
}

export const RATE_LIMITS = {
  startInterview: { name: "interview:start", limit: 15, windowSec: 3600 },
  answer: { name: "interview:answer", limit: 40, windowSec: 600 },
  finish: { name: "interview:finish", limit: 20, windowSec: 3600 },
  resume: { name: "resume:upload", limit: 10, windowSec: 3600 },
  transcribe: { name: "voice:transcribe", limit: 120, windowSec: 600 },
  jd: { name: "jd:analyze", limit: 30, windowSec: 3600 },
  auth: { name: "auth", limit: 10, windowSec: 900 },
  email: { name: "auth:email", limit: 5, windowSec: 3600 },
  payment: { name: "billing:order", limit: 20, windowSec: 3600 },
} satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export async function rateLimit(rule: RateLimitRule, subject: string, now = new Date()): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_DISABLED === "true") return { ok: true, remaining: rule.limit, retryAfterSec: 0 };
  await connectDB();
  const windowMs = rule.windowSec * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const doc = await RateLimit.findOneAndUpdate(
    { key: `${rule.name}:${subject}`, windowStart },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart.getTime() + windowMs * 2) } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  const count = doc?.count ?? 1;
  return {
    ok: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSec: Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000),
  };
}

export class RateLimitError extends Error {
  constructor(public retryAfterSec: number) {
    super("Too many requests. Please slow down and try again shortly.");
  }
}

export async function enforceRateLimit(rule: RateLimitRule, subject: string): Promise<void> {
  const result = await rateLimit(rule, subject);
  if (!result.ok) throw new RateLimitError(result.retryAfterSec);
}
