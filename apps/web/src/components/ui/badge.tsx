import { cn } from "@/lib/utils"
import type * as React from "react"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      {...(variant ? { "data-variant": variant } : {})}
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-foreground/10 data-[variant=default]:bg-primary data-[variant=default]:text-primary-foreground data-[variant=secondary]:bg-secondary data-[variant=secondary]:text-secondary-foreground data-[variant=destructive]:bg-destructive data-[variant=destructive]:text-destructive-foreground data-[variant=outline]:border data-[variant=outline]:border-border data-[variant=outline]:text-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
export type { BadgeVariant }
