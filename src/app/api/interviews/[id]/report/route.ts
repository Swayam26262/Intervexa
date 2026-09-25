import { after, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Interview } from "@/lib/models/interview";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { jsonError, withUser } from "@/lib/server/api";
import { getInterview } from "@/lib/server/data";
import { generateReport } from "@/lib/server/interview-service";

/** Report generation status (polled by the report page). */
export const GET = withUser(async (userId, _request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const interview = await getInterview(userId, id);
  if (!interview) return jsonError("Interview not found", 404);
  return NextResponse.json({ status: interview.status, reportStatus: interview.reportStatus ?? (interview.report ? "ready" : null) });
});

/** Retries report generation after a failure (or a stale pending state). */
export const POST = withUser(
  async (userId, _request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const interview = await getInterview(userId, id);
    if (!interview || interview.status !== "completed") return jsonError("Interview not found", 404);
    if (interview.reportStatus === "ready") return NextResponse.json({ reportStatus: "ready" });
    await connectDB();
    await Interview.updateOne({ _id: id, userId }, { $set: { reportStatus: "pending" } });
    after(() => generateReport(userId, id));
    return NextResponse.json({ reportStatus: "pending" });
  },
  { rateLimit: RATE_LIMITS.finish },
);
