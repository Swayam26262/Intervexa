import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AuthToken, type AuthTokenType } from "@/lib/models/auth-token";
import { Interview } from "@/lib/models/interview";
import { Loop } from "@/lib/models/loop";
import { Payment } from "@/lib/models/payment";
import { Resume } from "@/lib/models/resume";
import { ResumeFile } from "@/lib/models/resume-file";
import { TopicScore } from "@/lib/models/topic-score";
import { User } from "@/lib/models/user";
import { decryptText, sha256 } from "@/lib/platform/crypto";
import { appUrl, emailLayout, sendEmail } from "@/lib/platform/email";
import { logger } from "@/lib/platform/logger";

const TTL: Record<AuthTokenType, number> = {
  verify_email: 48 * 3600 * 1000,
  reset_password: 60 * 60 * 1000,
};

async function issueToken(userId: string, type: AuthTokenType): Promise<string> {
  await connectDB();
  const token = randomBytes(32).toString("base64url");
  await AuthToken.deleteMany({ userId, type });
  await AuthToken.create({ userId, type, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TTL[type]) });
  return token;
}

/** Consumes a single-use token. Returns the user id, or null if invalid/expired. */
export async function consumeToken(token: string, type: AuthTokenType): Promise<string | null> {
  if (!token || token.length > 200) return null;
  await connectDB();
  const doc = await AuthToken.findOneAndDelete({ tokenHash: sha256(token), type, expiresAt: { $gt: new Date() } }).lean();
  return doc ? String(doc.userId) : null;
}

export async function sendVerificationEmail(userId: string): Promise<{ delivered: boolean }> {
  await connectDB();
  const user = await User.findById(userId).select({ email: 1, name: 1, emailVerified: 1 }).lean<{ email: string; name: string; emailVerified?: Date }>();
  if (!user || user.emailVerified) return { delivered: false };
  const url = `${appUrl()}/verify-email?token=${await issueToken(userId, "verify_email")}`;
  return sendEmail({
    to: user.email,
    subject: "Verify your email for Intervexa",
    text: `Hi ${user.name}, verify your email: ${url}`,
    html: emailLayout({
      heading: "Verify your email",
      body: `Hi ${user.name}, confirm this is your email so you can recover your account and get interview reminders.`,
      cta: { label: "Verify email", url },
    }),
  });
}

export async function verifyEmail(token: string): Promise<boolean> {
  const userId = await consumeToken(token, "verify_email");
  if (!userId) return false;
  await User.updateOne({ _id: userId }, { $set: { emailVerified: new Date() } });
  return true;
}

/** Always resolves the same way whether or not the email exists (no account enumeration). */
export async function requestPasswordReset(email: string): Promise<void> {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select({ _id: 1, name: 1, email: 1 }).lean<{ _id: unknown; name: string; email: string }>();
  if (!user) return;
  const url = `${appUrl()}/reset-password?token=${await issueToken(String(user._id), "reset_password")}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Intervexa password",
    text: `Reset your password (valid for 1 hour): ${url}`,
    html: emailLayout({
      heading: "Reset your password",
      body: "Someone (hopefully you) asked to reset your Intervexa password. This link is valid for one hour. If it wasn't you, you can ignore this email.",
      cta: { label: "Choose a new password", url },
    }),
  });
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
  const userId = await consumeToken(token, "reset_password");
  if (!userId) return false;
  // Resetting via email also proves ownership of the address.
  await User.updateOne(
    { _id: userId },
    { $set: { passwordHash: await bcrypt.hash(password, 10), emailVerified: new Date() } },
  );
  logger.info("password reset", { userId });
  return true;
}

export async function changePassword(userId: string, current: string, next: string): Promise<boolean> {
  await connectDB();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user?.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) return false;
  user.passwordHash = await bcrypt.hash(next, 10);
  await user.save();
  return true;
}

/** Everything we store about a user, decrypted, as one JSON document (GDPR-style export). */
export async function exportAccount(userId: string) {
  await connectDB();
  const [user, resumes, interviews, loops, payments] = await Promise.all([
    User.findById(userId).lean(),
    Resume.find({ userId }).select("+text").lean(),
    Interview.find({ userId }).lean(),
    Loop.find({ userId }).lean(),
    Payment.find({ userId }).lean(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    user,
    resumes: resumes.map((r) => ({ ...r, text: r.text ? decryptText(r.text) : undefined })),
    interviews,
    mockLoops: loops,
    payments,
  };
}

export async function deleteAccount(userId: string): Promise<void> {
  await connectDB();
  await Promise.all([
    Interview.deleteMany({ userId }),
    Resume.deleteMany({ userId }),
    ResumeFile.deleteMany({ userId }),
    TopicScore.deleteMany({ userId }),
    Loop.deleteMany({ userId }),
    AuthToken.deleteMany({ userId }),
  ]);
  // Payment records are kept (without personal data) for accounting; unlink them from the user.
  await Payment.updateMany({ userId }, { $unset: { userId: 1 } });
  await User.deleteOne({ _id: userId });
  logger.info("account deleted", { userId });
}
