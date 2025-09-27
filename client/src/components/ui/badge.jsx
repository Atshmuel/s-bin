import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        owner:
          "uppercase tracking-tighter bg-owner text-stone-50 w-fit h-fit",
        admin:
          "uppercase tracking-tighter bg-admin text-stone-50 w-fit  h-fit",
        active:
          "uppercase tracking-tighter bg-active text-stone-50 w-fit  h-fit",
        pending:
          "uppercase tracking-tighter bg-pending text-stone-50 w-fit  h-fit",
        inactive:
          "uppercase tracking-tighter bg-inactive text-stone-50 w-fit  h-fit",
        suspended:
          "uppercase tracking-tighter bg-suspended text-stone-50 w-fit  h-fit",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
