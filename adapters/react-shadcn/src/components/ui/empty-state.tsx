import * as React from "react"
import { cn } from "../../lib/utils"

function EmptyState({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-state" className={cn("gary-empty-state flex flex-col items-center justify-center gap-3 py-12 text-center", className)} {...props} />
}
function EmptyStateIcon({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-state-icon" className={cn("gary-empty-state__icon flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground", className)} {...props} />
}
function EmptyStateTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="empty-state-title" className={cn("gary-empty-state__title text-lg font-semibold", className)} {...props} />
}
function EmptyStateDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="empty-state-description" className={cn("gary-empty-state__description max-w-sm text-sm text-muted-foreground", className)} {...props} />
}
function EmptyStateAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-state-action" className={cn("gary-empty-state__action mt-2", className)} {...props} />
}

export { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription, EmptyStateAction }
