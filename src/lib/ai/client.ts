import { z } from "zod";
import { logger } from "@/lib/platform/logger";
import { activeProvider, type Tier } from "./providers";

export const DEFAULT_MODEL = "gemini-3.6-flash";

export function isAiConfigured(): boolean {
  return activeProvider() !== null;
}

export function aiModelName(tier: Tier = "deep"): string {
  return activeProvider()?.model(tier) ?? "demo";
}

export class AiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AiError";
  }
}

/** Converts a zod schema to a plain JSON Schema usable by every provider's structured output. */
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}
/** @deprecated use toJsonSchema */
export const toGeminiSchema = toJsonSchema;

/** Parses model output into the schema, tolerating code fences or leading prose. */
export function parseJsonOutput<T extends z.ZodType>(raw: string | undefined, schema: T): z.infer<T> {
  if (!raw) throw new AiError("Empty response from model");
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();
  if (!text.startsWith("{") && !text.startsWith("[")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) text = text.slice(start, end + 1);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new AiError("Model returned invalid JSON", { cause: error });
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AiError(`Model output failed validation: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Incrementally extracts a top-level string field from a JSON document that is still being
 * streamed, decoding escapes. Returns what is available so far and whether it is complete.
 */
export function extractStreamingField(raw: string, field: string): { value: string; complete: boolean } | null {
  const keyMatch = new RegExp(`"${field}"\\s*:\\s*"`).exec(raw);
  if (!keyMatch) return null;
  let i = keyMatch.index + keyMatch[0].length;
  let value = "";
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '"') return { value, complete: true };
    if (ch === "\\") {
      const next = raw[i + 1];
      if (next === undefined) break; // escape split across chunks
      if (next === "u") {
        const hex = raw.slice(i + 2, i + 6);
        if (hex.length < 4) break;
        value += String.fromCharCode(parseInt(hex, 16));
        i += 6;
        continue;
      }
      const map: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", '"': '"', "\\": "\\", "/": "/" };
      value += map[next] ?? next;
      i += 2;
      continue;
    }
    value += ch;
    i++;
  }
  return { value, complete: false };
}

export interface GenerateJsonOptions<T extends z.ZodType> {
  system: string;
  prompt: string;
  schema: T;
  /** Name for the schema (used by providers that require one). */
  name?: string;
  /** "fast" for live turns, "deep" (default) for plans and reports. */
  tier?: Tier;
  /** Streams the value of this string field as it is generated. */
  stream?: { field: string; onDelta: (text: string) => void };
}

/**
 * Calls the active provider with a JSON response schema and validates the result with zod.
 * Retries once on transport or validation failure (the retry is not streamed).
 */
export async function generateJson<T extends z.ZodType>({
  system,
  prompt,
  schema,
  name = "response",
  tier = "deep",
  stream,
}: GenerateJsonOptions<T>): Promise<z.infer<T>> {
  const provider = activeProvider();
  if (!provider) throw new AiError("No AI provider is configured");
  const request = { system, prompt, schema: toJsonSchema(schema), name, tier };
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const started = Date.now();
    try {
      let raw: string;
      if (stream && attempt === 0) {
        let buffer = "";
        let sent = 0;
        raw = await provider.generate(request, (delta) => {
          buffer += delta;
          const field = extractStreamingField(buffer, stream.field);
          if (field && field.value.length > sent) {
            stream.onDelta(field.value.slice(sent));
            sent = field.value.length;
          }
        });
      } else {
        raw = await provider.generate(request);
      }
      const parsed = parseJsonOutput(raw, schema);
      logger.debug("ai call", { provider: provider.name, model: provider.model(tier), name, ms: Date.now() - started });
      return parsed;
    } catch (error) {
      lastError = error;
      logger.warn("ai call failed", { provider: provider.name, name, attempt, error });
    }
  }
  throw lastError instanceof AiError ? lastError : new AiError("AI request failed", { cause: lastError });
}
