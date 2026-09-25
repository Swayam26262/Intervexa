import { after, NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { withUser } from "@/lib/server/api";
import { finishInterview, generateReport } from "@/lib/server/interview-service";

export const maxDuration = 60;

export const POST = withUser(
  async (userId, _request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const outcome = await finishInterview(userId, id);
    // Generate the report after the response is sent, so ending the interview is instant.
    if (outcome.status === "completed" && outcome.generateReport) after(() => generateReport(userId, id));
    return NextResponse.json({ status: outcome.status });
  },
  { rateLimit: RATE_LIMITS.finish },
);
