import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { errorResponse, withUser } from "@/lib/server/api";
import { submitAnswer } from "@/lib/server/interview-service";
import { answerInput } from "@/lib/validation";

export const maxDuration = 60;

/**
 * Submits an answer. With `Accept: text/event-stream` the interviewer's reply is streamed as
 * Server-Sent Events: `delta` (text chunks), then `done` (the full outcome) or `error`.
 */
export const POST = withUser(
  async (userId, request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const input = answerInput.parse(await request.json());

    if (!request.headers.get("accept")?.includes("text/event-stream")) {
      return NextResponse.json(await submitAnswer(userId, id, input));
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) =>
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        try {
          const outcome = await submitAnswer(userId, id, input, (text) => send("delta", { text }));
          send("done", outcome);
        } catch (error) {
          const res = errorResponse(error);
          send("error", { status: res.status, ...(await res.json()) });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
    });
  },
  { rateLimit: RATE_LIMITS.answer },
);
