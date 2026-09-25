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
import { llmEngine } from "./llm-engine";
import { activeProvider, type ProviderName } from "./providers";

/** Stored on each interview: which provider ran it ("demo" = offline engine). */
export type AiMode = ProviderName | "demo";

export interface InterviewEngine {
  mode: "llm" | "demo";
  /** Builds the interview plan, greeting and opening question. */
  plan(ctx: InterviewContext): Promise<PlanResult>;
  /**
   * Evaluates the latest answer (the last turn must be answered) and produces the next
   * interviewer message. When `info.mustWrapUp` is set the result action is "wrap_up".
   * `onDelta` receives the interviewer's message as it streams (when supported).
   */
  nextTurn(
    ctx: InterviewContext,
    plan: InterviewPlan,
    turns: Turn[],
    info: TurnInfo,
    onDelta?: (text: string) => void,
  ): Promise<TurnResult>;
  /** Builds the final report from the full transcript. */
  report(ctx: InterviewContext, plan: InterviewPlan, turns: Turn[], communication: CommunicationStats): Promise<ReportDraft>;
}

export function currentAiMode(): AiMode {
  return activeProvider()?.name ?? "demo";
}

/**
 * Returns the engine for a stored mode. Interviews started in demo mode stay in demo mode;
 * LLM interviews use the active provider (falling back to demo if every key was removed).
 */
export function getEngine(mode: AiMode = currentAiMode()): InterviewEngine {
  return mode !== "demo" && isAiConfigured() ? llmEngine : demoEngine;
}
