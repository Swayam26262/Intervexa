import { z } from "zod";
import {
  ANSWER_MODES,
  DIFFICULTIES,
  DURATIONS,
  INTERVIEW_TYPES,
  PERSONALITIES,
} from "@/lib/interview/config";

export const MAX_ANSWER_CHARS = 5000;
export const MAX_JD_CHARS = 12000;

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
    .refine((n) => (DURATIONS as readonly number[]).includes(n), "Choose 15, 30 or 45 minutes"),
  personality: z.enum(PERSONALITIES),
  answerMode: z.enum(ANSWER_MODES),
  useResume: z.boolean().default(true),
  jobDescription: z.string().trim().max(MAX_JD_CHARS, "Job description is too long").optional(),
  focus: z.string().trim().max(200).optional(),
});

export const answerInput = z.object({
  answer: z.string().trim().min(1, "Answer can't be empty").max(MAX_ANSWER_CHARS, "Answer is too long"),
  durationSec: z.number().min(0).max(60 * 60).optional(),
  inputMode: z.enum(ANSWER_MODES).default("text"),
});

export const signupInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
