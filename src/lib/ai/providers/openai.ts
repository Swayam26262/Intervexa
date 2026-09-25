import OpenAI, { toFile } from "openai";
import type { JsonRequest, Provider, Tier } from "./types";

let client: OpenAI | null = null;
function openai(): OpenAI {
  client ??= new OpenAI();
  return client;
}

/** Strict structured outputs need every object closed and every property required. */
export function isStrictCompatible(schema: unknown): boolean {
  if (!schema || typeof schema !== "object") return true;
  const s = schema as Record<string, unknown>;
  if (s.type === "object" || s.properties) {
    const props = Object.keys((s.properties as Record<string, unknown>) ?? {});
    const required = (s.required as string[]) ?? [];
    if (s.additionalProperties !== false) return false;
    if (!props.every((p) => required.includes(p))) return false;
  }
  return Object.values(s).every((v) =>
    Array.isArray(v) ? v.every(isStrictCompatible) : typeof v === "object" ? isStrictCompatible(v) : true,
  );
}

function body(req: JsonRequest, model: string) {
  return {
    model,
    instructions: req.system,
    input: req.prompt,
    text: {
      format: {
        type: "json_schema" as const,
        name: req.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64),
        schema: req.schema,
        strict: isStrictCompatible(req.schema),
      },
    },
  };
}

export const openaiProvider: Provider = {
  name: "openai",
  label: "OpenAI",
  configured: () => Boolean(process.env.OPENAI_API_KEY),
  model: (tier: Tier) =>
    (tier === "fast" ? process.env.OPENAI_MODEL_FAST : undefined) || process.env.OPENAI_MODEL || "gpt-5-mini",

  async generate(req, onText) {
    const request = body(req, this.model(req.tier));
    if (!onText) return (await openai().responses.create(request)).output_text;
    const stream = openai().responses.stream(request);
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") onText(event.delta);
    }
    return (await stream.finalResponse()).output_text;
  },

  async transcribe(audio, mimeType) {
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
    const result = await openai().audio.transcriptions.create({
      file: await toFile(audio, `answer.${ext}`, { type: mimeType }),
      model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
    });
    return result.text.trim();
  },
};
