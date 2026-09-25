import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptBuffer, decryptText, encryptBuffer, encryptText, sha256 } from "@/lib/platform/crypto";
import { buildSentryEnvelope } from "@/lib/platform/error-reporter";

describe("encryption at rest", () => {
  const saved = { key: process.env.ENCRYPTION_KEY, secret: process.env.AUTH_SECRET };
  beforeEach(() => {
    delete process.env.ENCRYPTION_KEY;
    process.env.AUTH_SECRET = "unit-test-secret";
  });
  afterEach(() => {
    process.env.ENCRYPTION_KEY = saved.key;
    process.env.AUTH_SECRET = saved.secret;
    if (saved.key === undefined) delete process.env.ENCRYPTION_KEY;
    if (saved.secret === undefined) delete process.env.AUTH_SECRET;
  });

  it("round-trips text with a random IV each time", () => {
    const a = encryptText("Swayam — résumé ✓");
    const b = encryptText("Swayam — résumé ✓");
    expect(a).toMatch(/^enc:v1:/);
    expect(a).not.toBe(b);
    expect(decryptText(a)).toBe("Swayam — résumé ✓");
  });

  it("passes legacy plaintext through unchanged", () => {
    expect(decryptText("plain old text")).toBe("plain old text");
  });

  it("round-trips buffers and detects tampering", () => {
    const enc = encryptBuffer(Buffer.from("%PDF-1.7 bytes"));
    expect(decryptBuffer(enc).toString()).toBe("%PDF-1.7 bytes");
    enc[enc.length - 1] ^= 0xff;
    expect(() => decryptBuffer(enc)).toThrow();
  });

  it("uses an explicit 32-byte ENCRYPTION_KEY and rejects a wrong-sized one", () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const enc = encryptText("hello");
    expect(decryptText(enc)).toBe("hello");
    process.env.ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => encryptText("hello")).toThrow(/32 bytes/);
  });

  it("hashes deterministically", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("buildSentryEnvelope", () => {
  it("builds a three-line envelope with the error and string-safe extras", () => {
    const dsn = "https://publickey@o1.ingest.sentry.io/42";
    const env = buildSentryEnvelope(new TypeError("boom"), { route: "/api/x", error: "dropped", meta: { a: 1 } }, dsn, "abc123");
    const [header, item, payload] = env.split("\n").map((l) => JSON.parse(l));
    expect(header).toMatchObject({ event_id: "abc123", dsn });
    expect(item).toEqual({ type: "event" });
    expect(payload.exception.values[0]).toMatchObject({ type: "TypeError", value: "boom" });
    expect(payload.extra).toEqual({ route: "/api/x", meta: '{"a":1}' });
  });

  it("wraps non-Error values", () => {
    const env = buildSentryEnvelope("just a string", {}, "https://k@h/1", "id");
    expect(JSON.parse(env.split("\n")[2]).exception.values[0].value).toBe("just a string");
  });
});
