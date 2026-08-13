/** shadcn/ui primitives — buttons, cards, inputs, and dialogs used across TripHub. */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-channel focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-channel text-white shadow-[0_10px_24px_-10px_rgba(14,165,233,0.7)] hover:bg-channel/90 hover:shadow-[0_12px_28px_-10px_rgba(14,165,233,0.8)]",
        outline: "border border-border bg-white text-soundings hover:bg-secondary",
        ghost: "text-soundings hover:bg-secondary",
        secondary: "bg-secondary text-soundings hover:bg-secondary/80",
        confirm: "bg-channel text-white px-8 shadow-[0_10px_24px_-10px_rgba(14,165,233,0.7)] hover:bg-channel/90",
        book: "bg-channel text-white shadow-[0_10px_24px_-10px_rgba(14,165,233,0.7)] hover:bg-channel/90",
        link: "text-channel underline-offset-4 hover:underline rounded-sm",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
