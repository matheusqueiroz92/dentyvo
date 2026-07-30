import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        primary: "bg-primary/10 text-primary",
        success:
          "bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-subtle-foreground))]",
        warning:
          "bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning-subtle-foreground))]",
        info: "bg-[hsl(var(--info-subtle))] text-[hsl(var(--info-subtle-foreground))]",
        accent: "bg-accent text-accent-foreground",
        destructive:
          "bg-[hsl(var(--destructive-subtle))] text-[hsl(var(--destructive-subtle-foreground))]",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
