import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAiConfigured } from "@/lib/ai/client";
import { transcriptionProvider } from "@/lib/ai/providers";
import { getProblem, publicProblem } from "@/lib/interview/coding-problems";
import { DIFFICULTY_META, LANGUAGES, maxQuestionsFor, PERSONALITY_META, TYPE_META } from "@/lib/interview/config";
import { getPack } from "@/lib/interview/packs";
import { getInterview } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { InterviewRoom } from "./interview-room";

export const metadata: Metadata = { title: "Interview" };

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const interview = await getInterview(userId, id);
  if (!interview) notFound();
  if (interview.status === "completed") redirect(`/interview/${id}/report`);

  const { config } = interview;
  const pack = getPack(config.packId);
  const problem = config.type === "coding" ? getProblem(config.problemId) : undefined;
  const language = LANGUAGES[config.language ?? "en"];
  const subtitle = [
    DIFFICULTY_META[config.difficulty].label,
    pack ? pack.label : `${PERSONALITY_META[config.personality].label} interviewer`,
    config.language && config.language !== "en" ? language.label : null,
    config.useResume ? "resume-aware" : null,
    config.jobDescription ? "JD-tailored" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <InterviewRoom
      data={{
        id,
        title: config.drill ? `Drill · ${config.focus}` : `${config.role} · ${TYPE_META[config.type].label}`,
        subtitle,
        interviewerLabel: pack ? `${pack.label} interviewer` : `${PERSONALITY_META[config.personality].label} interviewer`,
        greeting: interview.greeting,
        closing: interview.closing,
        startedAt: interview.startedAt.toISOString(),
        durationMinutes: config.durationMinutes,
        maxQuestions: maxQuestionsFor(config.durationMinutes, config.type),
        answerMode: config.answerMode,
        speechLang: language.speech,
        languageCode: config.language ?? "en",
        demo: interview.aiMode === "demo" || !isAiConfigured(),
        serverStt: Boolean(transcriptionProvider()),
        whiteboard: config.type === "system_design" || config.type === "project_deep_dive",
        problem: problem ? publicProblem(problem) : undefined,
        codeLanguage: config.codeLanguage,
        turns: interview.turns.map((t) => ({
          index: t.index,
          topic: t.topic,
          question: t.question,
          answer: t.answer,
          attachments: [
            ...(t.code ? [t.code.tests ? `Code · ${t.code.tests.passed}/${t.code.tests.total} tests` : "Code"] : []),
            ...(t.diagram ? ["Whiteboard"] : []),
          ],
        })),
      }}
    />
  );
}
