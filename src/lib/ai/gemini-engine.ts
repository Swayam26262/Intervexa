import { normalizeEvaluation } from "@/lib/interview/progress";
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

export const geminiEngine: InterviewEngine = {
  mode: "gemini",

  async plan(ctx) {
    const out = await generateJson({
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

  async nextTurn(ctx, plan, turns, info) {
    const system = interviewerSystemPrompt(ctx);
    const lastTopic = turns[turns.length - 1].topic;

    if (info.mustWrapUp) {
      const out = await generateJson({ system, prompt: wrapUpPrompt(ctx, plan, turns), schema: wrapUpSchema });
      return {
        evaluation: normalizeEvaluation(out.evaluation),
        action: "wrap_up",
        topic: lastTopic,
        message: out.message.trim(),
      };
    }

    const out = await generateJson({ system, prompt: turnPrompt(ctx, plan, turns, info), schema: turnSchema });
    return {
      evaluation: normalizeEvaluation(out.evaluation),
      action: out.action,
      topic: out.topic.trim() || lastTopic,
      message: out.message.trim(),
    };
  },

  async report(ctx, plan, turns, communication) {
    return generateJson({
      system: reportSystemPrompt(),
      prompt: reportPrompt(ctx, plan, turns, communication),
      schema: reportSchema,
    });
  },
};
