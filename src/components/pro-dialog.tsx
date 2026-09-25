"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function ProDialog({ open, onOpenChange, message }: { open: boolean; onOpenChange: (open: boolean) => void; message: string }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Sparkles />}
      title="Unlock with Pro or credits"
      description={
        <>
          {message} Pro gives you unlimited interviews and every feature for 30 days, or buy a few interview credits — each
          one is a full Pro-level interview.
        </>
      }
      actions={
        <>
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild>
            <Link href="/billing">See plans</Link>
          </Button>
        </>
      }
    />
  );
}

export function ProBadge() {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-tertiary-container px-2 text-label-sm text-on-tertiary-container">
      <Sparkles className="size-3" /> Pro
    </span>
  );
}
