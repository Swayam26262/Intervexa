"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "../actions";
import { FormMessage, PasswordField } from "../auth-form";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-5">
        <FormMessage state={state} />
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField autoComplete="new-password" minLength={8} label="New password" />
      <PasswordField id="confirm" name="confirm" autoComplete="new-password" minLength={8} label="Confirm new password" />
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Update password
      </Button>
    </form>
  );
}
