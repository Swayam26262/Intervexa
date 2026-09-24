import { NextResponse } from "next/server";
import { z } from "zod";
import { AiError } from "@/lib/ai/client";
import { ResumeParseError } from "@/lib/resume/extract-text";
import { ServiceError } from "./interview-service";
import { getUserId } from "./session";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a route handler with auth and consistent error responses. */
export function withUser<Args extends unknown[]>(
  handler: (userId: string, ...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    const userId = await getUserId();
    if (!userId) return jsonError("Please sign in", 401);
    try {
      return await handler(userId, ...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonError(error.issues[0]?.message ?? "Invalid request", 400);
      }
      if (error instanceof ServiceError) return jsonError(error.message, error.status);
      if (error instanceof ResumeParseError) return jsonError(error.message, 422);
      if (error instanceof AiError) {
        console.error("[ai]", error, error.cause);
        return jsonError("The AI interviewer had trouble responding. Please try again.", 502);
      }
      console.error(error);
      return jsonError("Something went wrong. Please try again.", 500);
    }
  };
}
