import { NextResponse } from "next/server";
import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { connectDB } from "@/lib/db";
import { Resume } from "@/lib/models/resume";
import { User } from "@/lib/models/user";
import {
  detectResumeKind,
  extractResumeText,
  MAX_RESUME_BYTES,
} from "@/lib/resume/extract-text";
import { jsonError, withUser } from "@/lib/server/api";
import { getUser } from "@/lib/server/data";

export const maxDuration = 60;

export const POST = withUser(async (userId, request: Request) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Please choose a file to upload", 400);
  if (file.size > MAX_RESUME_BYTES) return jsonError("Resume must be 5 MB or smaller", 413);
  const kind = detectResumeKind(file.name, file.type);
  if (!kind) return jsonError("Upload a PDF, DOCX or TXT file", 415);

  const text = await extractResumeText(Buffer.from(await file.arrayBuffer()), kind);
  const user = await getUser(userId);
  const { analysis, mode } = await analyzeResume(text, user?.profile?.targetRole || undefined);

  await connectDB();
  // MVP keeps one resume per user: save the new one, then remove older ones.
  const saved = await Resume.create({ userId, fileName: file.name.slice(0, 200), mimeType: file.type || kind, text, analysis, aiMode: mode });
  await Resume.deleteMany({ userId, _id: { $ne: saved._id } });

  // Fill empty profile fields from the resume so the first interview is already personalised.
  const updates: Record<string, unknown> = {};
  if (!user?.profile?.skills?.length && analysis.skills.length) {
    updates["profile.skills"] = analysis.skills.slice(0, 15).map((s) => s.name);
  }
  if (!user?.profile?.experienceYears && analysis.totalExperienceYears) {
    updates["profile.experienceYears"] = analysis.totalExperienceYears;
  }
  if (Object.keys(updates).length) await User.updateOne({ _id: userId }, { $set: updates });

  return NextResponse.json({ analysis, profileUpdated: Object.keys(updates) });
});
