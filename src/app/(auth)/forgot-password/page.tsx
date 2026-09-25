import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8 space-y-2">
        <h1 className="text-headline-md">Forgot your password?</h1>
        <p className="text-body-lg text-on-surface-variant">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      </div>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-body-md text-on-surface-variant">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
