import { NextResponse } from "next/server";
import { z } from "zod";
import { paymentsSimulated } from "@/lib/billing/razorpay";
import { fulfillOrder } from "@/lib/billing/service";
import { connectDB } from "@/lib/db";
import { Payment } from "@/lib/models/payment";
import { jsonError, withUser } from "@/lib/server/api";

const input = z.object({ orderId: z.string().startsWith("sim_").max(40) });

/** Development-only: completes a simulated order. Disabled whenever Razorpay is configured. */
export const POST = withUser(async (userId, request: Request) => {
  if (!paymentsSimulated()) return jsonError("Not available", 404);
  const { orderId } = input.parse(await request.json());
  await connectDB();
  if (!(await Payment.exists({ orderId, userId, provider: "simulated" }))) return jsonError("Order not found", 404);
  await fulfillOrder(orderId, `simpay_${Date.now()}`);
  return NextResponse.json({ ok: true });
});
