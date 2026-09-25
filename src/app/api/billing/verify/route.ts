import { NextResponse } from "next/server";
import { z } from "zod";
import { fulfillOrder } from "@/lib/billing/service";
import { verifyPaymentSignature } from "@/lib/billing/razorpay";
import { connectDB } from "@/lib/db";
import { Payment } from "@/lib/models/payment";
import { jsonError, withUser } from "@/lib/server/api";

const input = z.object({
  razorpay_order_id: z.string().max(100),
  razorpay_payment_id: z.string().max(100),
  razorpay_signature: z.string().max(200),
});

/** Called by the Checkout success handler. The signature proves Razorpay confirmed the payment. */
export const POST = withUser(async (userId, request: Request) => {
  const body = input.parse(await request.json());
  if (!verifyPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
    return jsonError("Payment verification failed", 400);
  }
  await connectDB();
  const owned = await Payment.exists({ orderId: body.razorpay_order_id, userId });
  if (!owned) return jsonError("Order not found", 404);
  await fulfillOrder(body.razorpay_order_id, body.razorpay_payment_id);
  return NextResponse.json({ ok: true });
});
