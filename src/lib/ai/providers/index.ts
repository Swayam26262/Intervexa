import { claude } from "./anthropic";
import { gemini } from "./gemini";
import { openaiProvider } from "./openai";
import type { Provider, ProviderName } from "./types";

export const PROVIDERS: Record<ProviderName, Provider> = {
  gemini,
  anthropic: claude,
  openai: openaiProvider,
};

/**
 * The active provider: AI_PROVIDER if set (and configured), otherwise the first provider
 * with an API key, in the order Gemini → Claude → OpenAI. Null means demo mode.
 */
export function activeProvider(): Provider | null {
  const preferred = process.env.AI_PROVIDER as ProviderName | undefined;
  if (preferred && PROVIDERS[preferred]?.configured()) return PROVIDERS[preferred];
  return [gemini, claude, openaiProvider].find((p) => p.configured()) ?? null;
}

/** Provider with speech-to-text: the active one if it has STT, else any configured one that does. */
export function transcriptionProvider(): Provider | null {
  const active = activeProvider();
  if (active?.transcribe) return active;
  return [gemini, openaiProvider].find((p) => p.configured() && p.transcribe) ?? null;
}

export type { Provider, ProviderName, Tier } from "./types";
