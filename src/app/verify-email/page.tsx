import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/server/account-service";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await verifyEmail(token) : false;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <Logo className="justify-center" />
        <div className="rounded-3xl bg-surface-container-low p-8">
          <div className={`mx-auto mb-4 grid size-14 place-items-center rounded-full ${ok ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"}`}>
            {ok ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
          </div>
          <h1 className="text-headline-sm">{ok ? "Email verified" : "Link expired"}</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {ok ? "Thanks — your account is fully set up." : "This verification link is invalid or has expired. You can send a new one from Settings."}
          </p>
          <Button asChild className="mt-6">
            <Link href={ok ? "/dashboard" : "/settings#email"}>{ok ? "Go to dashboard" : "Open settings"}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
