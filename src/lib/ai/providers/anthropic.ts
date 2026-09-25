import Anthropic from "@anthropic-ai/sdk";
import type { JsonRequest, Provider, Tier } from "./types";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

function params(req: JsonRequest, model: string) {
  return {
    model,
    max_tokens: req.tier === "fast" ? 4000 : 16000,
    system: req.system,
    messages: [{ role: "user" as const, content: req.prompt }],
    // Adaptive thinking is on by default for current models; effort trades depth for latency.
    output_config: {
      effort: (req.tier === "fast" ? process.env.ANTHROPIC_EFFORT_FAST || "low" : process.env.ANTHROPIC_EFFORT_DEEP || "medium") as
        | "low"
        | "medium"
        | "high",
      format: { type: "json_schema" as const, schema: req.schema },
    },
    // If a request is declined by a safety classifier, re-run it on Anthropic's recommended
    // fallback model server-side instead of failing the interview turn.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default" as const,
  };
}

function textOf(message: Anthropic.Beta.BetaMessage): string {
  if (message.stop_reason === "refusal") {
    throw new Error(`Claude declined the request (${message.stop_details?.category ?? "unspecified"})`);
  }
  return message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export const claude: Provider = {
  name: "anthropic",
  label: "Anthropic Claude",
  configured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  model: (tier: Tier) =>
    (tier === "fast" ? process.env.ANTHROPIC_MODEL_FAST : undefined) || process.env.ANTHROPIC_MODEL || "claude-opus-5",

  async generate(req, onText) {
    const request = params(req, this.model(req.tier));
    if (!onText) return textOf(await anthropic().beta.messages.create(request));
    const stream = anthropic().beta.messages.stream(request);
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
    }
    return textOf(await stream.finalMessage());
  },
};
