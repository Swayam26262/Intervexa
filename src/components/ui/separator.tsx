import * as React from "react";
import { cn } from "@/lib/utils";

function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr data-slot="separator" className={cn("border-t border-outline-variant", className)} {...props} />;
}

export { Separator };
