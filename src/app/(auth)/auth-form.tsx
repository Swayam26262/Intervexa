"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { googleSignInAction, loginAction, signupAction } from "./actions";

export function PasswordField({ id = "password", name = "password", autoComplete, minLength, label = "Password" }: { id?: string; name?: string; autoComplete: string; minLength?: number; label?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} required className="pr-12" />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="state-layer absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full text-on-surface-variant"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </div>
  );
}

export function FormMessage({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-xl bg-error-container px-4 py-3 text-body-md text-on-error-container">
        {state.error}
      </p>
    );
  }
  if (state?.ok) {
    return (
      <p role="status" className="rounded-xl bg-success-container px-4 py-3 text-body-md text-on-success-container">
        {state.ok}
      </p>
    );
  }
  return null;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function AuthForm({ mode, googleEnabled, next }: { mode: "login" | "signup"; googleEnabled: boolean; next?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? loginAction : signupAction, undefined);
  return (
    <div className="space-y-6">
      {googleEnabled && (
        <>
          <form action={googleSignInAction}>
            <Button type="submit" variant="outline" size="lg" className="w-full text-on-surface">
              <GoogleIcon /> Continue with Google
            </Button>
          </form>
          <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="h-px flex-1 bg-outline-variant" /> or <span className="h-px flex-1 bg-outline-variant" />
          </div>
        </>
      )}
      <form action={action} className="space-y-5">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" autoComplete="name" required placeholder="Swayam Patil" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        <PasswordField autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "signup" ? 8 : undefined} />
        {mode === "login" && (
          <div className="-mt-2 text-right">
            <Link href="/forgot-password" className="text-label-lg text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        )}
        <FormMessage state={state} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-body-md text-on-surface-variant">
        {mode === "login" ? (
          <>
            New to Intervexa?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
