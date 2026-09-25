import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/platform/rate-limit";
import { detectResumeKind, MAX_RESUME_BYTES } from "@/lib/resume/extract-text";
import { jsonError, withUser } from "@/lib/server/api";
import { uploadResume } from "@/lib/server/resume-service";

export const maxDuration = 60;

export const POST = withUser(
  async (userId, request: Request) => {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Please choose a file to upload", 400);
    if (file.size > MAX_RESUME_BYTES) return jsonError("Resume must be 5 MB or smaller", 413);
    const kind = detectResumeKind(file.name, file.type);
    if (!kind) return jsonError("Upload a PDF, DOCX or TXT file", 415);
    const result = await uploadResume(userId, { name: file.name, type: file.type, kind, buffer: Buffer.from(await file.arrayBuffer()) });
    return NextResponse.json(result);
  },
  { rateLimit: RATE_LIMITS.resume },
);
