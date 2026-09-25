import { NextResponse } from "next/server";
import { z } from "zod";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { jsonError, withUser } from "@/lib/server/api";
import { changePassword } from "@/lib/server/account-service";
import { passwordInput } from "@/lib/validation";

const input = z.object({ current: z.string().max(200), next: passwordInput });

export const POST = withUser(
  async (userId, request: Request) => {
    const { current, next } = input.parse(await request.json());
    if (!(await changePassword(userId, current, next))) return jsonError("Your current password is incorrect", 400);
    return NextResponse.json({ ok: true });
  },
  { rateLimit: RATE_LIMITS.auth },
);
