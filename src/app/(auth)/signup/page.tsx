import type { Metadata } from "next";
import { googleEnabled } from "@/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <div className="mb-8 space-y-2">
        <h1 className="text-headline-md">Create your account</h1>
        <p className="text-body-lg text-on-surface-variant">Your first mock interview is two minutes away.</p>
      </div>
      <AuthForm mode="signup" googleEnabled={googleEnabled} />
    </>
  );
}
