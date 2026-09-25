"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "../actions";
import { FormMessage } from "../auth-form";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending || Boolean(state?.ok)}>
        {pending && <Loader2 className="animate-spin" />} Send reset link
      </Button>
    </form>
  );
}
