import { randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db";
import { Interview } from "@/lib/models/interview";
import { Payment } from "@/lib/models/payment";
import { User } from "@/lib/models/user";
import { logger } from "@/lib/platform/logger";
import { computeEntitlements, getProduct, startOfMonth, type Entitlements } from "./plans";
import { createRazorpayOrder, paymentsSimulated, razorpayConfigured } from "./razorpay";

export async function getEntitlements(userId: string, now = new Date()): Promise<Entitlements> {
  await connectDB();
  const [user, freeUsed] = await Promise.all([
    User.findById(userId).select({ plan: 1 }).lean<{ plan?: { proUntil?: Date; credits?: number } }>(),
    Interview.countDocuments({ userId, billing: "free", createdAt: { $gte: startOfMonth(now) } }),
  ]);
  return computeEntitlements({ proUntil: user?.plan?.proUntil ?? null, credits: user?.plan?.credits ?? 0, freeUsedThisMonth: freeUsed }, now);
}

/** Atomically consumes one credit. Returns false if none were left (race-safe). */
export async function consumeCredit(userId: string): Promise<boolean> {
  await connectDB();
  const res = await User.updateOne({ _id: userId, "plan.credits": { $gt: 0 } }, { $inc: { "plan.credits": -1 } });
  return res.modifiedCount === 1;
}

export async function refundCredit(userId: string): Promise<void> {
  await connectDB();
  await User.updateOne({ _id: userId }, { $inc: { "plan.credits": 1 } });
}

export interface CheckoutOrder {
  mode: "razorpay" | "simulated";
  orderId: string;
  amountPaise: number;
  keyId?: string;
  productName: string;
}

export async function createOrder(userId: string, productId: string): Promise<CheckoutOrder> {
  const product = getProduct(productId);
  if (!product) throw new Error("Unknown product");
  const amountPaise = product.amountInr * 100;
  await connectDB();

  if (razorpayConfigured()) {
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: `ivx_${randomBytes(6).toString("hex")}`,
      notes: { userId, productId },
    });
    await Payment.create({ userId, provider: "razorpay", productId, amountPaise, orderId: order.id, status: "created" });
    return { mode: "razorpay", orderId: order.id, amountPaise, keyId: process.env.RAZORPAY_KEY_ID, productName: product.name };
  }
  if (paymentsSimulated()) {
    const orderId = `sim_${randomBytes(8).toString("hex")}`;
    await Payment.create({ userId, provider: "simulated", productId, amountPaise, orderId, status: "created" });
    return { mode: "simulated", orderId, amountPaise, productName: product.name };
  }
  throw new Error("Payments are not configured");
}

/**
 * Marks an order paid and applies the purchase exactly once (safe to call from both the
 * checkout callback and the webhook).
 */
export async function fulfillOrder(orderId: string, paymentId: string): Promise<{ applied: boolean; userId?: string }> {
  await connectDB();
  const payment = await Payment.findOneAndUpdate(
    { orderId, fulfilledAt: { $exists: false } },
    { $set: { status: "paid", paymentId, fulfilledAt: new Date() } },
    { new: true },
  );
  if (!payment) return { applied: false };
  const product = getProduct(payment.productId);
  if (!product) {
    logger.error("paid order for unknown product", { orderId, productId: payment.productId });
    return { applied: false };
  }
  if (product.kind === "credits") {
    await User.updateOne({ _id: payment.userId }, { $inc: { "plan.credits": product.credits ?? 0 } });
  } else {
    const user = await User.findById(payment.userId).select({ plan: 1 }).lean<{ plan?: { proUntil?: Date } }>();
    const now = new Date();
    const base = user?.plan?.proUntil && user.plan.proUntil > now ? user.plan.proUntil : now;
    await User.updateOne(
      { _id: payment.userId },
      { $set: { "plan.proUntil": new Date(base.getTime() + (product.days ?? 30) * 86_400_000) } },
    );
  }
  logger.info("purchase fulfilled", { orderId, productId: product.id, userId: String(payment.userId) });
  return { applied: true, userId: String(payment.userId) };
}
