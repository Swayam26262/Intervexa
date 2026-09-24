import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { withUser } from "@/lib/server/api";
import { profileInput } from "@/lib/validation";

export const PUT = withUser(async (userId, request: Request) => {
  const { name, ...profile } = profileInput.parse(await request.json());
  await connectDB();
  await User.updateOne({ _id: userId }, { $set: { name, profile } });
  return NextResponse.json({ ok: true });
});
