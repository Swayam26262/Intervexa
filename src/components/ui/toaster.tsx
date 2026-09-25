"use client";

import { Toaster as Sonner } from "sonner";

/** Snackbars (M3): inverse surface, bottom-center, one line with an optional action. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={24}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[min(560px,calc(100vw-32px))] items-center gap-3 rounded-lg bg-inverse-surface px-4 py-3.5 text-body-md text-inverse-on-surface shadow-elevation-3",
          title: "flex-1",
          description: "text-body-sm opacity-80",
          actionButton: "rounded-full px-3 py-1.5 text-label-lg text-inverse-primary hover:bg-white/10",
          cancelButton: "rounded-full px-3 py-1.5 text-label-lg text-inverse-on-surface/80",
          icon: "[&_svg]:size-5",
        },
      }}
    />
  );
}

export { toast } from "sonner";
