import { z } from "zod";
import { jdAnalysisSchema } from "@/lib/ai/jd-analyzer";
import {
  ANSWER_MODES,
  DIFFICULTIES,
  DURATIONS,
  INTERVIEW_TYPES,
  LANGUAGE_CODES,
  PERSONALITIES,
  type Language,
} from "@/lib/interview/config";

export const MAX_ANSWER_CHARS = 5000;
export const MAX_JD_CHARS = 12000;
export const MAX_CODE_CHARS = 20000;

export const profileInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  currentRole: z.string().trim().max(120).default(""),
  targetRole: z.string().trim().max(120).default(""),
  experienceYears: z.coerce.number().min(0).max(50).default(0),
  location: z.string().trim().max(120).default(""),
  education: z.string().trim().max(200).default(""),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(50, "Up to 50 skills")
    .default([])
    .transform((skills) => [...new Map(skills.map((s) => [s.toLowerCase(), s])).values()]),
  preferredDifficulty: z.enum(DIFFICULTIES).default("medium"),
});
export type ProfileInput = z.infer<typeof profileInput>;

export const interviewInput = z.object({
  role: z.string().trim().min(2, "Role is required").max(120),
  experienceYears: z.coerce.number().min(0).max(50),
  type: z.enum(INTERVIEW_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  durationMinutes: z.coerce
    .number()
    .refine((n) => (DURATIONS as readonly number[]).includes(n), "Choose 10, 15, 30 or 45 minutes"),
  personality: z.enum(PERSONALITIES),
  answerMode: z.enum(ANSWER_MODES),
  useResume: z.boolean().default(true),
  jobDescription: z.string().trim().max(MAX_JD_CHARS, "Job description is too long").optional(),
  focus: z.string().trim().max(200).optional(),
  language: z.enum(LANGUAGE_CODES as [Language, ...Language[]]).default("en"),
  packId: z.string().max(40).optional(),
  drill: z.boolean().optional(),
  problemId: z.string().max(60).optional(),
  codeLanguage: z.enum(["javascript", "python"]).optional(),
  jdAnalysis: jdAnalysisSchema.optional(),
});

const testResult = z.object({
  name: z.string().max(60),
  passed: z.boolean(),
  expected: z.string().max(500),
  actual: z.string().max(500).optional(),
  error: z.string().max(500).optional(),
});

export const answerInput = z.object({
  answer: z.string().trim().min(1, "Answer can't be empty").max(MAX_ANSWER_CHARS, "Answer is too long"),
  /** Index of the question being answered — makes retries and double-clicks idempotent. */
  turnIndex: z.number().int().min(1).optional(),
  durationSec: z.number().min(0).max(60 * 60).optional(),
  inputMode: z.enum(ANSWER_MODES).default("text"),
  code: z
    .object({
      language: z.enum(["javascript", "python"]),
      source: z.string().max(MAX_CODE_CHARS, "Code is too long"),
      tests: z.object({ passed: z.number().int().min(0), total: z.number().int().min(0), results: z.array(testResult).max(30) }).optional(),
    })
    .optional(),
  diagram: z.object({ summary: z.string().max(4000) }).optional(),
  speech: z.object({ pauses: z.number().int().min(0).max(500), longestPauseSec: z.number().min(0).max(3600) }).optional(),
});

export const signupInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const passwordInput = z.string().min(8, "Password must be at least 8 characters").max(200);

export const loopInput = z.object({
  jobDescription: z.string().trim().min(80, "Paste the full job description (at least a few lines)").max(MAX_JD_CHARS),
  packId: z.string().max(40).optional(),
  difficulty: z.enum(DIFFICULTIES).default("medium"),
  role: z.string().trim().max(120).optional(),
});
