import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { withUser } from "@/lib/server/api";
import { sendVerificationEmail } from "@/lib/server/account-service";

/** Resends the verification email. */
export const POST = withUser(
  async (userId) => {
    const { delivered } = await sendVerificationEmail(userId);
    return NextResponse.json({ ok: true, delivered });
  },
  { rateLimit: RATE_LIMITS.email },
);
