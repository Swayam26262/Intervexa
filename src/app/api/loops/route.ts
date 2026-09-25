import { NextResponse } from "next/server";
import { getEntitlements } from "@/lib/billing/service";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { jsonError, withUser } from "@/lib/server/api";
import { createLoop } from "@/lib/server/loop-service";
import { loopInput } from "@/lib/validation";

export const maxDuration = 60;

export const POST = withUser(
  async (userId, request: Request) => {
    const input = loopInput.parse(await request.json());
    const entitlements = await getEntitlements(userId);
    if (!entitlements.features.loops) return jsonError("Full mock loops are part of Pro.", 402, { code: "feature" });
    const id = await createLoop(userId, input);
    return NextResponse.json({ id }, { status: 201 });
  },
  { rateLimit: RATE_LIMITS.jd },
);
