"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { rateLimit, RATE_LIMITS } from "@/lib/platform/rate-limit";
import { clientIp } from "@/lib/server/api";
import { requestPasswordReset, resetPassword, sendVerificationEmail } from "@/lib/server/account-service";
import { passwordInput, signupInput } from "@/lib/validation";

export type AuthState = { error?: string; ok?: string } | undefined;

async function limited(bucket: "auth" | "email"): Promise<boolean> {
  const result = await rateLimit(RATE_LIMITS[bucket], await clientIp());
  return !result.ok;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited("auth")) return { error: "Too many attempts. Please wait a few minutes and try again." };
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: String(formData.get("next") || "/dashboard"),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error; // Re-throw the redirect.
  }
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited("auth")) return { error: "Too many attempts. Please wait a few minutes and try again." };
  const parsed = signupInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };

  await connectDB();
  const { name, email, password } = parsed.data;
  if (await User.exists({ email })) return { error: "An account with this email already exists. Log in instead." };
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), provider: "credentials" });
  await sendVerificationEmail(String(user._id)).catch(() => undefined);

  try {
    await signIn("credentials", { email, password, redirectTo: "/profile?welcome=1" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created, but sign-in failed. Please log in." };
    throw error;
  }
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited("email")) return { error: "Too many requests. Please try again later." };
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Enter the email you signed up with." };
  await requestPasswordReset(email);
  // Same response whether or not the account exists.
  return { ok: "If an account exists for that email, we've sent a reset link. It's valid for one hour." };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (await limited("auth")) return { error: "Too many attempts. Please try again later." };
  const password = passwordInput.safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0]?.message };
  if (formData.get("password") !== formData.get("confirm")) return { error: "Passwords don't match." };
  const ok = await resetPassword(String(formData.get("token") ?? ""), password.data);
  if (!ok) return { error: "This reset link is invalid or has expired. Request a new one." };
  return { ok: "Password updated. You can now log in with your new password." };
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
