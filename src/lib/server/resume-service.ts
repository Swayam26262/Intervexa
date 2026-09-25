import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { getEntitlements } from "@/lib/billing/service";
import { connectDB } from "@/lib/db";
import { Resume } from "@/lib/models/resume";
import { ResumeFile } from "@/lib/models/resume-file";
import { User } from "@/lib/models/user";
import { decryptBuffer, encryptBuffer, encryptText } from "@/lib/platform/crypto";
import { extractResumeText } from "@/lib/resume/extract-text";
import { getUser } from "./data";
import { ServiceError } from "./interview-service";

export async function uploadResume(
  userId: string,
  file: { name: string; type: string; buffer: Buffer; kind: "pdf" | "docx" | "txt" },
) {
  const text = await extractResumeText(file.buffer, file.kind);
  const [user, entitlements] = await Promise.all([getUser(userId), getEntitlements(userId)]);
  const { analysis, mode } = await analyzeResume(text, user?.profile?.targetRole || undefined);

  await connectDB();
  const stored = await ResumeFile.create({ userId, data: encryptBuffer(file.buffer) });
  const saved = await Resume.create({
    userId,
    fileName: file.name.slice(0, 200),
    mimeType: file.type || file.kind,
    size: file.buffer.length,
    text: encryptText(text),
    fileId: stored._id,
    isActive: true,
    analysis,
    aiMode: mode,
  });
  // The new upload becomes the active resume.
  await Resume.updateMany({ userId, _id: { $ne: saved._id } }, { $set: { isActive: false } });

  // Enforce the plan's resume limit by removing the oldest extras.
  const all = await Resume.find({ userId }).sort({ createdAt: -1 }).select({ _id: 1, fileId: 1 }).lean();
  const extra = all.slice(entitlements.maxResumes);
  if (extra.length) {
    await Resume.deleteMany({ _id: { $in: extra.map((r) => r._id) } });
    await ResumeFile.deleteMany({ _id: { $in: extra.map((r) => r.fileId).filter(Boolean) } });
  }

  // Fill empty profile fields from the resume so the first interview is already personalised.
  const updates: Record<string, unknown> = {};
  if (!user?.profile?.skills?.length && analysis.skills.length) {
    updates["profile.skills"] = analysis.skills.slice(0, 15).map((s) => s.name);
  }
  if (!user?.profile?.experienceYears && analysis.totalExperienceYears) {
    updates["profile.experienceYears"] = analysis.totalExperienceYears;
  }
  if (Object.keys(updates).length) await User.updateOne({ _id: userId }, { $set: updates });

  return { id: String(saved._id), analysis, profileUpdated: Object.keys(updates), replaced: extra.length };
}

export async function setActiveResume(userId: string, resumeId: string): Promise<void> {
  await connectDB();
  const res = await Resume.updateOne({ _id: resumeId, userId }, { $set: { isActive: true } });
  if (!res.matchedCount) throw new ServiceError("Resume not found", 404);
  await Resume.updateMany({ userId, _id: { $ne: resumeId } }, { $set: { isActive: false } });
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  await connectDB();
  const doc = await Resume.findOneAndDelete({ _id: resumeId, userId }).lean();
  if (!doc) throw new ServiceError("Resume not found", 404);
  if (doc.fileId) await ResumeFile.deleteOne({ _id: doc.fileId, userId });
  if (doc.isActive !== false) {
    const next = await Resume.findOne({ userId }).sort({ createdAt: -1 });
    if (next) await Resume.updateOne({ _id: next._id }, { $set: { isActive: true } });
  }
}

export async function getResumeFile(userId: string, resumeId: string) {
  await connectDB();
  const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
  if (!resume?.fileId) throw new ServiceError("Original file not available", 404);
  // Hydrated (not lean) so `data` is a real Buffer of the exact stored length.
  const file = await ResumeFile.findOne({ _id: resume.fileId, userId });
  if (!file) throw new ServiceError("Original file not available", 404);
  return { name: resume.fileName, type: resume.mimeType, data: decryptBuffer(Buffer.from(file.data)) };
}
