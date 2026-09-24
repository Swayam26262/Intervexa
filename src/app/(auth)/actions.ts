"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { signupInput } from "@/lib/validation";

export type AuthState = { error?: string } | undefined;

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error; // Re-throw the redirect.
  }
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };

  await connectDB();
  const { name, email, password } = parsed.data;
  if (await User.exists({ email })) return { error: "An account with this email already exists. Log in instead." };
  await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), provider: "credentials" });

  try {
    await signIn("credentials", { email, password, redirectTo: "/profile?welcome=1" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created, but sign-in failed. Please log in." };
    throw error;
  }
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
