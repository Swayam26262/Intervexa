import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobDescription } from "@/lib/ai/jd-analyzer";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { withUser } from "@/lib/server/api";
import { getActiveResume, getUser } from "@/lib/server/data";
import { MAX_JD_CHARS } from "@/lib/validation";

export const maxDuration = 60;

const input = z.object({ jobDescription: z.string().trim().min(40, "Paste a longer job description").max(MAX_JD_CHARS) });

export const POST = withUser(
  async (userId, request: Request) => {
    const { jobDescription } = input.parse(await request.json());
    const [user, resume] = await Promise.all([getUser(userId), getActiveResume(userId)]);
    const analysis = await analyzeJobDescription(jobDescription, { profileSkills: user?.profile?.skills ?? [], resume: resume?.analysis });
    return NextResponse.json({ analysis });
  },
  { rateLimit: RATE_LIMITS.jd },
);
