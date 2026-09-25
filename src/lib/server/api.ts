import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { AiError } from "@/lib/ai/client";
import { logger } from "@/lib/platform/logger";
import { enforceRateLimit, RateLimitError, type RateLimitRule } from "@/lib/platform/rate-limit";
import { ResumeParseError } from "@/lib/resume/extract-text";
import { ServiceError } from "./interview-service";
import { getUserId } from "./session";

export function jsonError(message: string, status: number, extra: Record<string, unknown> = {}, init: ResponseInit = {}) {
  return NextResponse.json({ error: message, ...extra }, { ...init, status });
}

/** Maps known errors to HTTP responses. */
export function errorResponse(error: unknown): Response {
  if (error instanceof z.ZodError) return jsonError(error.issues[0]?.message ?? "Invalid request", 400);
  if (error instanceof RateLimitError) {
    return jsonError(error.message, 429, {}, { headers: { "Retry-After": String(error.retryAfterSec) } });
  }
  if (error instanceof ServiceError) return jsonError(error.message, error.status, error.code ? { code: error.code } : {});
  if (error instanceof ResumeParseError) return jsonError(error.message, 422);
  if (error instanceof AiError) {
    logger.error("ai failure", { error, cause: error.cause });
    return jsonError("The AI interviewer had trouble responding. Please try again.", 502);
  }
  logger.error("unhandled api error", { error });
  return jsonError("Something went wrong. Please try again.", 500);
}

/** Client IP for anonymous rate limiting (first X-Forwarded-For hop). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Wraps a route handler with auth, optional per-user rate limiting and consistent errors. */
export function withUser<Args extends unknown[]>(
  handler: (userId: string, ...args: Args) => Promise<Response>,
  options: { rateLimit?: RateLimitRule } = {},
) {
  return async (...args: Args): Promise<Response> => {
    const userId = await getUserId();
    if (!userId) return jsonError("Please sign in", 401);
    try {
      if (options.rateLimit) await enforceRateLimit(options.rateLimit, userId);
      return await handler(userId, ...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
