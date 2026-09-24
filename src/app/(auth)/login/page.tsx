import type { Metadata } from "next";
import { googleEnabled } from "@/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Pick up where your last interview left off.</p>
      </div>
      <AuthForm mode="login" googleEnabled={googleEnabled} />
    </>
  );
}
