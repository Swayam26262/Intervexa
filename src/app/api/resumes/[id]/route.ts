import { NextResponse } from "next/server";
import { withUser } from "@/lib/server/api";
import { deleteResume, setActiveResume } from "@/lib/server/resume-service";

type Ctx = { params: Promise<{ id: string }> };

/** Makes this the resume interviews use. */
export const PATCH = withUser(async (userId, _request: Request, { params }: Ctx) => {
  await setActiveResume(userId, (await params).id);
  return NextResponse.json({ ok: true });
});

export const DELETE = withUser(async (userId, _request: Request, { params }: Ctx) => {
  await deleteResume(userId, (await params).id);
  return NextResponse.json({ ok: true });
});
