import { NextResponse } from "next/server";
import { transcriptionProvider } from "@/lib/ai/providers";
import { LANGUAGES, type Language } from "@/lib/interview/config";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { jsonError, withUser } from "@/lib/server/api";

export const maxDuration = 60;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

/**
 * Server-side speech-to-text for browsers without the Web Speech API (Safari, Firefox) and for
 * higher accuracy. Returns 501 when no configured provider supports audio.
 */
export const POST = withUser(
  async (_userId, request: Request) => {
    const provider = transcriptionProvider();
    if (!provider?.transcribe) return jsonError("Server transcription isn't configured", 501);
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) return jsonError("No audio received", 400);
    if (audio.size > MAX_AUDIO_BYTES) return jsonError("Recording is too long", 413);
    const lang = String(form.get("language") ?? "en") as Language;
    const text = await provider.transcribe(
      Buffer.from(await audio.arrayBuffer()),
      audio.type || "audio/webm",
      LANGUAGES[lang]?.prompt,
    );
    return NextResponse.json({ text });
  },
  { rateLimit: RATE_LIMITS.transcribe },
);
