import { normalizeEvaluation } from "@/lib/interview/progress";
import type { ClaimCheck, CodeReview, ReportDraft } from "@/lib/interview/types";
import type { InterviewEngine } from "./engine";
import { generateJson } from "./client";
import {
  interviewerSystemPrompt,
  planPrompt,
  reportPrompt,
  reportSystemPrompt,
  turnPrompt,
  wrapUpPrompt,
} from "./prompts";
import { planSchema, reportSchema, turnSchema, wrapUpSchema } from "./schemas";

const clamp10 = (n: number) => Math.round(Math.min(10, Math.max(0, Number.isFinite(n) ? n : 0)) * 10) / 10;

/** Interview engine backed by whichever LLM provider is active (Gemini, Claude or OpenAI). */
export const llmEngine: InterviewEngine = {
  mode: "llm",

  async plan(ctx) {
    const out = await generateJson({
      name: "interview_plan",
      system: interviewerSystemPrompt(ctx),
      prompt: planPrompt(ctx),
      schema: planSchema,
    });
    const topics = out.topics.filter((t) => t.name.trim()).slice(0, 8);
    const memoryTopics = ctx.memory?.recurringWeakTopics.map((t) => t.topic) ?? [];
    return {
      plan: {
        focusSummary: out.focusSummary,
        topics,
        memoryNote: memoryTopics.length
          ? `Revisiting recurring weak areas: ${memoryTopics.join(", ")}`
          : undefined,
      },
      greeting: out.greeting.trim(),
      openingQuestion: out.openingQuestion.trim(),
      openingTopic: out.openingTopic.trim() || topics[0]?.name || "Introduction",
    };
  },

  async nextTurn(ctx, plan, turns, info, onDelta) {
    const system = interviewerSystemPrompt(ctx);
    const lastTopic = turns[turns.length - 1].topic;
    const stream = onDelta ? { field: "message", onDelta } : undefined;

    if (info.mustWrapUp) {
      const out = await generateJson({
        name: "interview_wrap_up",
        system,
        prompt: wrapUpPrompt(ctx, plan, turns),
        schema: wrapUpSchema,
        tier: "fast",
        stream,
      });
      return {
        evaluation: normalizeEvaluation(out.evaluation),
        action: "wrap_up",
        topic: lastTopic,
        message: out.message.trim(),
      };
    }

    const out = await generateJson({
      name: "interview_turn",
      system,
      prompt: turnPrompt(ctx, plan, turns, info),
      schema: turnSchema,
      tier: "fast",
      stream,
    });
    return {
      evaluation: normalizeEvaluation(out.evaluation),
      action: out.action,
      topic: out.topic.trim() || lastTopic,
      message: out.message.trim(),
    };
  },

  async report(ctx, plan, turns, communication) {
    const out = await generateJson({
      name: "interview_report",
      system: reportSystemPrompt(),
      prompt: reportPrompt(ctx, plan, turns, communication),
      schema: reportSchema,
    });
    const { claims, coding, ...rest } = out;
    const draft: ReportDraft = { ...rest };
    if (claims?.length) draft.claims = claims.slice(0, 8) as ClaimCheck[];
    if (coding) {
      draft.coding = {
        ...coding,
        correctness: clamp10(coding.correctness),
        complexity: clamp10(coding.complexity),
        edgeCases: clamp10(coding.edgeCases),
        codeQuality: clamp10(coding.codeQuality),
        explanation: clamp10(coding.explanation),
        notes: coding.notes.slice(0, 5),
      } satisfies CodeReview;
    }
    return draft;
  },
};
