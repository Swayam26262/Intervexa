export type ProviderName = "gemini" | "anthropic" | "openai";

/** "fast" = live interview turns (latency-sensitive); "deep" = plans, reports, analyses. */
export type Tier = "fast" | "deep";

export interface JsonRequest {
  system: string;
  prompt: string;
  /** JSON Schema (from zod) describing the expected output. */
  schema: Record<string, unknown>;
  /** Short identifier for the schema (OpenAI requires one). */
  name: string;
  tier: Tier;
}

export interface Provider {
  name: ProviderName;
  label: string;
  configured(): boolean;
  model(tier: Tier): string;
  /**
   * Returns the model's raw JSON text. When `onText` is given the response is streamed and
   * each text delta is forwarded as it arrives.
   */
  generate(req: JsonRequest, onText?: (delta: string) => void): Promise<string>;
  /** Server-side speech-to-text; undefined when the provider has no audio model. */
  transcribe?(audio: Buffer, mimeType: string, languageHint?: string): Promise<string>;
}
