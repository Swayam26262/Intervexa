import type { Metadata } from "next";
import { googleEnabled } from "@/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <div className="mb-8 space-y-2">
        <h1 className="text-headline-md">Welcome back</h1>
        <p className="text-body-lg text-on-surface-variant">Pick up where your last interview left off.</p>
      </div>
      <AuthForm mode="login" googleEnabled={googleEnabled} next={next?.startsWith("/") && !next.startsWith("//") ? next : undefined} />
    </>
  );
}
