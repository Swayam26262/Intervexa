import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClasses } from "./input";

/** Styled native select: accessible, mobile-friendly, and works without client JS. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(fieldClasses, "h-12 appearance-none pr-11 [&>option]:bg-surface-container", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-on-surface-variant" />
    </div>
  );
}

export { NativeSelect };
