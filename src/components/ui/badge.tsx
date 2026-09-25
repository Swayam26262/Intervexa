import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-label-md whitespace-nowrap [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary",
        secondary: "bg-surface-container-highest text-on-surface-variant",
        accent: "bg-secondary-container text-on-secondary-container",
        primary: "bg-primary-container text-on-primary-container",
        tertiary: "bg-tertiary-container text-on-tertiary-container",
        outline: "border border-outline-variant text-on-surface-variant",
        success: "bg-success-container text-on-success-container",
        warning: "bg-warning-container text-on-warning-container",
        destructive: "bg-error-container text-on-error-container",
      },
    },
    defaultVariants: { variant: "secondary" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
