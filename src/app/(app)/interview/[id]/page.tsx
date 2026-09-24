import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAiConfigured } from "@/lib/ai/client";
import { DIFFICULTY_META, maxQuestionsFor, PERSONALITY_META, TYPE_META } from "@/lib/interview/config";
import { getInterview } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { InterviewRoom } from "./interview-room";

export const metadata: Metadata = { title: "Interview" };

export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const userId = await requireUserId();
  const [{ id }, { mode }] = await Promise.all([params, searchParams]);
  const interview = await getInterview(userId, id);
  if (!interview) notFound();
  if (interview.status === "completed") redirect(`/interview/${id}/report`);

  const { config } = interview;
  return (
    <InterviewRoom
      data={{
        id,
        title: `${config.role} · ${TYPE_META[config.type].label}`,
        subtitle: `${DIFFICULTY_META[config.difficulty].label} · ${PERSONALITY_META[config.personality].label} interviewer${config.useResume ? " · resume-aware" : ""}${config.jobDescription ? " · JD-tailored" : ""}`,
        greeting: interview.greeting,
        closing: interview.closing,
        startedAt: interview.startedAt.toISOString(),
        durationMinutes: config.durationMinutes,
        maxQuestions: maxQuestionsFor(config.durationMinutes),
        answerMode: mode === "voice" || mode === "text" ? mode : config.answerMode,
        demo: interview.aiMode === "demo" || !isAiConfigured(),
        turns: interview.turns.map((t) => ({ index: t.index, topic: t.topic, question: t.question, answer: t.answer })),
      }}
    />
  );
}
