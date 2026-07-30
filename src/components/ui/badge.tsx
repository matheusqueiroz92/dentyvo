import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-primary/10 text-primary",
        success: "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))]",
        warning: "bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning-subtle-foreground))]",
        info: "bg-[hsl(var(--info-subtle))] text-[hsl(var(--info-subtle-foreground))]",
        accent: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
