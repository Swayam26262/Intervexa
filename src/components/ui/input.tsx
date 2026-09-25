import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClasses =
  "w-full min-w-0 rounded-xl border border-outline bg-transparent px-4 text-body-lg text-on-surface transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-on-surface-variant/70 hover:border-on-surface focus-visible:border-primary focus-visible:shadow-[inset_0_0_0_1px_var(--primary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error md:text-body-md";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldClasses, "h-12", className)} {...props} />;
}

export { Input };
