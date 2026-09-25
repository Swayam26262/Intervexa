import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/billing/service";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { withUser } from "@/lib/server/api";
import { ServiceError } from "@/lib/server/interview-service";

const input = z.object({ productId: z.string().max(40) });

/** Creates a Razorpay order (or a simulated one in PAYMENTS_MODE=simulate). */
export const POST = withUser(
  async (userId, request: Request) => {
    const { productId } = input.parse(await request.json());
    try {
      return NextResponse.json(await createOrder(userId, productId));
    } catch (error) {
      if (error instanceof Error && /not configured|Unknown product/.test(error.message)) {
        throw new ServiceError(error.message === "Unknown product" ? error.message : "Payments aren't set up yet.", 400);
      }
      throw error;
    }
  },
  { rateLimit: RATE_LIMITS.payment },
);
