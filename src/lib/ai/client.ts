import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const DEFAULT_MODEL = "gemini-3.6-flash";

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function aiModelName(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new AiError("GEMINI_API_KEY is not set");
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export class AiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AiError";
  }
}

/** Converts a zod schema to the JSON-schema subset Gemini accepts for structured output. */
export function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

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

export interface GenerateJsonOptions<T extends z.ZodType> {
  system: string;
  prompt: string;
  schema: T;
}

/**
 * Calls Gemini with a JSON response schema and validates the result with zod.
 * Retries once on transport or validation failure.
 */
export async function generateJson<T extends z.ZodType>({
  system,
  prompt,
  schema,
}: GenerateJsonOptions<T>): Promise<z.infer<T>> {
  const ai = getClient();
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: aiModelName(),
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: toGeminiSchema(schema),
        },
      });
      return parseJsonOutput(response.text, schema);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof AiError
    ? lastError
    : new AiError("AI request failed", { cause: lastError });
}
