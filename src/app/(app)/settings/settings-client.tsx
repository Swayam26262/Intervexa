"use client";

import { useState } from "react";
import { Download, Loader2, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { applyTheme, type ThemePreference } from "@/components/shell/theme";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedButton } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toaster";

export function ThemeSetting({ initial }: { initial: ThemePreference }) {
  const [theme, setTheme] = useState(initial);
  return (
    <SegmentedButton
      ariaLabel="Theme"
      className="max-w-md"
      value={theme}
      onChange={(v) => {
        setTheme(v);
        applyTheme(v);
      }}
      options={[
        { value: "system", label: "System", icon: <Monitor /> },
        { value: "light", label: "Light", icon: <Sun /> },
        { value: "dark", label: "Dark", icon: <Moon /> },
      ]}
    />
  );
}

export function ResendVerification() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  return (
    <Button
      variant="tonal"
      disabled={state !== "idle"}
      onClick={async () => {
        setState("sending");
        const res = await fetch("/api/account/verify-email", { method: "POST" });
        if (res.ok) {
          setState("sent");
          toast.success("Verification email sent — check your inbox.");
        } else {
          setState("idle");
          toast.error((await res.json().catch(() => null))?.error ?? "Couldn't send the email.");
        }
      }}
    >
      {state === "sending" && <Loader2 className="animate-spin" />}
      {state === "sent" ? "Email sent" : "Resend verification email"}
    </Button>
  );
}

export function ChangePassword() {
  const [pending, setPending] = useState(false);
  return (
    <form
      className="grid max-w-xl gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        if (data.get("next") !== data.get("confirm")) {
          toast.error("New passwords don't match.");
          return;
        }
        setPending(true);
        const res = await fetch("/api/account/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current: data.get("current"), next: data.get("next") }),
        });
        setPending(false);
        if (res.ok) {
          form.reset();
          toast.success("Password updated.");
        } else toast.error((await res.json().catch(() => null))?.error ?? "Couldn't update your password.");
      }}
    >
      <div className="sm:col-span-2">
        <Label htmlFor="current" className="mb-2">
          Current password
        </Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="next" className="mb-2">
          New password
        </Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <Label htmlFor="confirm" className="mb-2">
          Confirm new password
        </Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Update password
        </Button>
      </div>
    </form>
  );
}

export function ExportData() {
  return (
    <Button asChild variant="outline">
      <a href="/api/account/export" download>
        <Download /> Download my data (JSON)
      </a>
    </Button>
  );
}

export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 /> Delete account
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        icon={<Trash2 />}
        title="Delete your account?"
        description="This permanently deletes your profile, resumes, interviews, reports and mock loops. It can't be undone."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || confirm.trim().toLowerCase() !== email}
              onClick={async () => {
                setPending(true);
                const res = await fetch("/api/account", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ confirmEmail: confirm }),
                });
                if (res.ok) await signOutAction();
                else {
                  setPending(false);
                  toast.error((await res.json().catch(() => null))?.error ?? "Couldn't delete your account.");
                }
              }}
            >
              {pending && <Loader2 className="animate-spin" />} Delete forever
            </Button>
          </>
        }
      >
        <Label htmlFor="confirm-email" className="mb-2">
          Type <span className="font-mono">{email}</span> to confirm
        </Label>
        <Input id="confirm-email" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
      </Dialog>
    </>
  );
}
