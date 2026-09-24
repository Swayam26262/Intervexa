import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AiError, parseJsonOutput, toGeminiSchema } from "@/lib/ai/client";
import { reportSchema, turnSchema } from "@/lib/ai/schemas";

const schema = z.object({ score: z.number(), tags: z.array(z.string()) });

describe("parseJsonOutput", () => {
  it("parses plain JSON", () => {
    expect(parseJsonOutput('{"score": 7, "tags": ["a"]}', schema)).toEqual({ score: 7, tags: ["a"] });
  });

  it("strips code fences and surrounding prose", () => {
    expect(parseJsonOutput('```json\n{"score": 1, "tags": []}\n```', schema).score).toBe(1);
    expect(parseJsonOutput('Here you go: {"score": 2, "tags": []} hope it helps', schema).score).toBe(2);
  });

  it("throws AiError for invalid JSON or schema mismatch", () => {
    expect(() => parseJsonOutput("not json", schema)).toThrow(AiError);
    expect(() => parseJsonOutput('{"score": "high", "tags": []}', schema)).toThrow(AiError);
    expect(() => parseJsonOutput(undefined, schema)).toThrow(AiError);
  });
});

describe("toGeminiSchema", () => {
  it("produces a JSON schema without the $schema key", () => {
    const json = toGeminiSchema(turnSchema);
    expect(json.$schema).toBeUndefined();
    expect(json.type).toBe("object");
    expect(json.required).toEqual(expect.arrayContaining(["evaluation", "action", "topic", "message"]));
  });

  it("represents nullable category scores", () => {
    const json = toGeminiSchema(reportSchema) as {
      properties: { categoryScores: { properties: Record<string, unknown> } };
    };
    expect(JSON.stringify(json.properties.categoryScores.properties.technicalKnowledge)).toContain("null");
  });
});
