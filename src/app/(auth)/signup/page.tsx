import type { Metadata } from "next";
import { googleEnabled } from "@/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">Your first mock interview is two minutes away.</p>
      </div>
      <AuthForm mode="signup" googleEnabled={googleEnabled} />
    </>
  );
}
