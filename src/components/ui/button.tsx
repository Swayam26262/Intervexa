import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Material 3 buttons: filled, tonal, outlined, text, elevated — pill-shaped with state layers. */
const buttonVariants = cva(
  "state-layer inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,box-shadow,color] duration-200 ease-[var(--ease-emphasized)] select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:shadow-elevation-1",
        tonal: "bg-secondary-container text-on-secondary-container hover:shadow-elevation-1",
        outline: "border border-outline bg-transparent text-primary",
        text: "bg-transparent text-primary",
        elevated: "bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2",
        destructive: "bg-error text-on-error hover:shadow-elevation-1",
        ghost: "bg-transparent text-on-surface-variant",
        inverse: "bg-inverse-surface text-inverse-on-surface",
        // Legacy aliases.
        secondary: "bg-secondary-container text-on-secondary-container",
        link: "text-primary underline-offset-4 hover:underline after:hidden",
      },
      size: {
        default: "h-10 px-5 text-label-lg",
        sm: "h-8 px-3.5 text-label-md",
        lg: "h-12 px-7 text-body-lg font-semibold",
        xl: "h-14 px-8 text-title-md",
        icon: "size-10",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
