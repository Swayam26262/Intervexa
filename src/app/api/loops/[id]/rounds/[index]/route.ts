import { NextResponse } from "next/server";
import { z } from "zod";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { withUser } from "@/lib/server/api";
import { startLoopRound } from "@/lib/server/loop-service";

export const maxDuration = 60;
const input = z.object({ answerMode: z.enum(["text", "voice"]).default("text") });

/** Starts (or resumes) a round of a mock loop. */
export const POST = withUser(
  async (userId, request: Request, { params }: { params: Promise<{ id: string; index: string }> }) => {
    const { id, index } = await params;
    const { answerMode } = input.parse(await request.json().catch(() => ({})));
    const interviewId = await startLoopRound(userId, id, Number(index), answerMode);
    return NextResponse.json({ interviewId });
  },
  { rateLimit: RATE_LIMITS.startInterview },
);
