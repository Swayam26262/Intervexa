import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <div className="mb-8 space-y-2">
        <h1 className="text-headline-md">Choose a new password</h1>
        <p className="text-body-lg text-on-surface-variant">Use at least 8 characters.</p>
      </div>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="rounded-xl bg-error-container px-4 py-3 text-body-md text-on-error-container">
          This link is missing its token. <Link href="/forgot-password" className="underline">Request a new link</Link>.
        </p>
      )}
    </>
  );
}
