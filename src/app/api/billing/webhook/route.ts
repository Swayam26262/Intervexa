import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/billing/service";
import { verifyWebhookSignature } from "@/lib/billing/razorpay";
import { connectDB } from "@/lib/db";
import { Payment } from "@/lib/models/payment";
import { logger } from "@/lib/platform/logger";

/**
 * Razorpay webhook (configure events: payment.captured, order.paid, payment.failed).
 * Backs up the Checkout callback so purchases are applied even if the browser closes.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const event = JSON.parse(raw) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string } }; order?: { entity?: { id: string } } };
  };
  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  if (!orderId) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const result = await fulfillOrder(orderId, payment?.id ?? "webhook");
    logger.info("razorpay webhook", { event: event.event, orderId, applied: result.applied });
  } else if (event.event === "payment.failed") {
    await connectDB();
    await Payment.updateOne({ orderId, status: "created" }, { $set: { status: "failed" } });
  }
  return NextResponse.json({ ok: true });
}
