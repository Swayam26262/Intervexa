import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, withUser } from "@/lib/server/api";
import { deleteAccount } from "@/lib/server/account-service";
import { getUser } from "@/lib/server/data";

const input = z.object({ confirmEmail: z.string().max(200) });

/** Permanently deletes the account and all its data. The client then signs out. */
export const DELETE = withUser(async (userId, request: Request) => {
  const { confirmEmail } = input.parse(await request.json());
  const user = await getUser(userId);
  if (!user || confirmEmail.trim().toLowerCase() !== user.email) return jsonError("Type your account email to confirm", 400);
  await deleteAccount(userId);
  return NextResponse.json({ ok: true });
});
