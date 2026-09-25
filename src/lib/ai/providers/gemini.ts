import { GoogleGenAI, ThinkingLevel, type GenerateContentConfig } from "@google/genai";
import type { JsonRequest, Provider, Tier } from "./types";

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const THINKING: Record<string, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

function config(req: JsonRequest): GenerateContentConfig {
  // Thinking level is opt-in per tier (e.g. GEMINI_THINKING_FAST=low) so older models that
  // don't support it keep working.
  const level = process.env[req.tier === "fast" ? "GEMINI_THINKING_FAST" : "GEMINI_THINKING_DEEP"]?.toLowerCase();
  return {
    systemInstruction: req.system,
    responseMimeType: "application/json",
    responseJsonSchema: req.schema,
    ...(level && THINKING[level] ? { thinkingConfig: { thinkingLevel: THINKING[level] } } : {}),
  };
}

export const gemini: Provider = {
  name: "gemini",
  label: "Google Gemini",
  configured: () => Boolean(process.env.GEMINI_API_KEY),
  model: (tier: Tier) =>
    (tier === "fast" ? process.env.GEMINI_MODEL_FAST : undefined) || process.env.GEMINI_MODEL || "gemini-3.6-flash",

  async generate(req, onText) {
    const params = { model: this.model(req.tier), contents: req.prompt, config: config(req) };
    if (!onText) return (await ai().models.generateContent(params)).text ?? "";
    let text = "";
    for await (const chunk of await ai().models.generateContentStream(params)) {
      const delta = chunk.text ?? "";
      if (delta) {
        text += delta;
        onText(delta);
      }
    }
    return text;
  },

  async transcribe(audio, mimeType, languageHint) {
    const response = await ai().models.generateContent({
      model: process.env.GEMINI_MODEL_FAST || process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: audio.toString("base64") } },
            {
              text: `Transcribe this interview answer verbatim${languageHint ? ` (spoken language: ${languageHint})` : ""}. Keep filler words like "um" and "uh". Return only the transcript text.`,
            },
          ],
        },
      ],
    });
    return (response.text ?? "").trim();
  },
};
