import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { withUser } from "@/lib/server/api";
import { startInterview } from "@/lib/server/interview-service";
import { interviewInput } from "@/lib/validation";

export const maxDuration = 60;

export const POST = withUser(
  async (userId, request: Request) => {
    const { jdAnalysis, ...config } = interviewInput.parse(await request.json());
    const id = await startInterview(
      userId,
      { ...config, jobDescription: config.jobDescription || undefined, focus: config.focus || undefined },
      { jdAnalysis },
    );
    return NextResponse.json({ id }, { status: 201 });
  },
  { rateLimit: RATE_LIMITS.startInterview },
);
