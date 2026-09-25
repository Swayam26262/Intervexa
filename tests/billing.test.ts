import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { computeEntitlements, FREE_MONTHLY_INTERVIEWS, getProduct, PRODUCTS } from "@/lib/billing/plans";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/billing/razorpay";

const NOW = new Date("2026-09-25T10:00:00Z");

describe("computeEntitlements", () => {
  it("gives everyone everything when billing is off", () => {
    const e = computeEntitlements({ freeUsedThisMonth: 50 }, NOW, false);
    expect(e.tier).toBe("unlimited");
    expect(e.nextSource).toBe("unlimited");
    expect(Object.values(e.features).every(Boolean)).toBe(true);
  });

  it("treats an active pro pass as pro, and an expired one as free", () => {
    const active = computeEntitlements({ proUntil: new Date("2026-10-01"), freeUsedThisMonth: 9 }, NOW, true);
    expect(active.tier).toBe("pro");
    expect(active.features.voice).toBe(true);
    const expired = computeEntitlements({ proUntil: new Date("2026-09-01"), freeUsedThisMonth: 0 }, NOW, true);
    expect(expired.tier).toBe("free");
    expect(expired.features.voice).toBe(false);
  });

  it("uses credits before the free quota", () => {
    const e = computeEntitlements({ credits: 2, freeUsedThisMonth: 0 }, NOW, true);
    expect(e.tier).toBe("credits");
    expect(e.nextSource).toBe("credit");
    expect(e.maxResumes).toBeGreaterThan(1);
  });

  it("runs out of free interviews at the monthly limit", () => {
    const left = computeEntitlements({ freeUsedThisMonth: FREE_MONTHLY_INTERVIEWS - 1 }, NOW, true);
    expect(left.nextSource).toBe("free");
    const none = computeEntitlements({ freeUsedThisMonth: FREE_MONTHLY_INTERVIEWS }, NOW, true);
    expect(none.nextSource).toBeNull();
    expect(none.maxResumes).toBe(1);
  });

  it("clamps negative credit balances", () => {
    expect(computeEntitlements({ credits: -3, freeUsedThisMonth: 0 }, NOW, true).credits).toBe(0);
  });
});

describe("products", () => {
  it("have unique ids and positive prices", () => {
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    expect(PRODUCTS.every((p) => p.amountInr > 0)).toBe(true);
    expect(getProduct("pro_30d")?.days).toBe(30);
    expect(getProduct("nope")).toBeUndefined();
  });
});

describe("Razorpay signatures", () => {
  const secret = "test_secret";
  const sign = (payload: string, key = secret) => createHmac("sha256", key).update(payload).digest("hex");

  it("accepts a valid checkout signature and rejects tampering", () => {
    const sig = sign("order_1|pay_1");
    expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sign("order_1|pay_1", "other"), secret)).toBe(false);
  });

  it("rejects malformed signatures and a missing secret", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", "not-hex!", secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "", secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sign("order_1|pay_1"), "")).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "abcd", secret)).toBe(false);
  });

  it("verifies webhook bodies byte-for-byte", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { amount: 19900 } });
    expect(verifyWebhookSignature(body, sign(body), secret)).toBe(true);
    expect(verifyWebhookSignature(`${body} `, sign(body), secret)).toBe(false);
  });
});
