import { NextResponse } from "next/server";
import { withUser } from "@/lib/server/api";
import { finishInterview } from "@/lib/server/interview-service";

export const maxDuration = 60;

export const POST = withUser(
  async (userId, _request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return NextResponse.json(await finishInterview(userId, id));
  },
);
