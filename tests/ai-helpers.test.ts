import { describe, expect, it } from "vitest";
import { z } from "zod";
import { extractStreamingField, toJsonSchema } from "@/lib/ai/client";
import { isStrictCompatible } from "@/lib/ai/providers/openai";

describe("extractStreamingField", () => {
  it("returns null until the key has arrived", () => {
    expect(extractStreamingField('{"thinking": "hm', "message")).toBeNull();
  });

  it("returns a partial value while streaming, then the complete one", () => {
    expect(extractStreamingField('{"message": "Walk me thr', "message")).toEqual({ value: "Walk me thr", complete: false });
    expect(extractStreamingField('{"message": "Walk me through it.", "topic": "x"}', "message")).toEqual({
      value: "Walk me through it.",
      complete: true,
    });
  });

  it("decodes escapes, including \\u sequences", () => {
    const raw = String.raw`{"message": "Line 1\nSaid \"why?\" — ok\\"}`;
    expect(extractStreamingField(raw, "message")).toEqual({ value: 'Line 1\nSaid "why?" — ok\\', complete: true });
  });

  it("waits when an escape is split across chunks", () => {
    expect(extractStreamingField('{"message": "a\\', "message")).toEqual({ value: "a", complete: false });
    expect(extractStreamingField('{"message": "a\\u20', "message")).toEqual({ value: "a", complete: false });
  });
});

describe("isStrictCompatible", () => {
  it("accepts closed objects with every property required", () => {
    const schema = toJsonSchema(z.object({ a: z.string(), b: z.array(z.object({ c: z.number() })) }));
    expect(isStrictCompatible(schema)).toBe(true);
  });

  it("rejects optional properties and open objects", () => {
    expect(isStrictCompatible(toJsonSchema(z.object({ a: z.string().optional() })))).toBe(false);
    expect(isStrictCompatible({ type: "object", properties: { a: { type: "string" } }, required: ["a"] })).toBe(false);
  });

  it("checks nested objects inside arrays", () => {
    const nested = {
      type: "object",
      additionalProperties: false,
      properties: { items: { type: "array", items: { type: "object", properties: { x: { type: "string" } }, required: [] } } },
      required: ["items"],
    };
    expect(isStrictCompatible(nested)).toBe(false);
  });
});
