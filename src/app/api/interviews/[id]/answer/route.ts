import { NextResponse } from "next/server";
import { withUser } from "@/lib/server/api";
import { submitAnswer } from "@/lib/server/interview-service";
import { answerInput } from "@/lib/validation";

export const maxDuration = 60;

export const POST = withUser(
  async (userId, request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const input = answerInput.parse(await request.json());
    return NextResponse.json(await submitAnswer(userId, id, input));
  },
);
