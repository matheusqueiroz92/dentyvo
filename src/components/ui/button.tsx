import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:opacity-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        danger:
          "bg-destructive text-destructive-foreground hover:opacity-95",
        link: "h-auto rounded-none p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 min-h-8 px-3 text-[13px] [&_svg]:size-4",
        md: "h-10 min-h-10 px-4 [&_svg]:size-[18px]",
        lg: "h-11 min-h-11 px-5 text-[15px] [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-[18px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
