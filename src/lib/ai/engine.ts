import type { TurnInfo } from "@/lib/interview/progress";
import type {
  CommunicationStats,
  InterviewContext,
  InterviewPlan,
  PlanResult,
  ReportDraft,
  Turn,
  TurnResult,
} from "@/lib/interview/types";
import { isAiConfigured } from "./client";
import { demoEngine } from "./demo/engine";
import { geminiEngine } from "./gemini-engine";

export type AiMode = "gemini" | "demo";

export interface InterviewEngine {
  mode: AiMode;
  /** Builds the interview plan, greeting and opening question. */
  plan(ctx: InterviewContext): Promise<PlanResult>;
  /**
   * Evaluates the latest answer (the last turn must be answered) and produces the next
   * interviewer message. When `info.mustWrapUp` is set the result action is "wrap_up".
   */
  nextTurn(ctx: InterviewContext, plan: InterviewPlan, turns: Turn[], info: TurnInfo): Promise<TurnResult>;
  /** Builds the final report from the full transcript. */
  report(ctx: InterviewContext, plan: InterviewPlan, turns: Turn[], communication: CommunicationStats): Promise<ReportDraft>;
}

export function currentAiMode(): AiMode {
  return isAiConfigured() ? "gemini" : "demo";
}

/**
 * Returns the engine for a mode. An interview keeps the engine it started with, unless it
 * started with Gemini and the key has since been removed.
 */
export function getEngine(mode: AiMode = currentAiMode()): InterviewEngine {
  return mode === "gemini" && isAiConfigured() ? geminiEngine : demoEngine;
}
