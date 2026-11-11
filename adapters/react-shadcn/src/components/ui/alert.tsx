import * as React from "react"
import { cn } from "../../lib/utils"

function Alert({ className, variant = "default", ...props }: React.ComponentProps<"div"> & { variant?: "default" | "success" | "warning" | "critical" }) {
  return (
    <div
      role="alert"
      data-slot="alert"
      data-variant={variant}
      className={cn("gary-alert relative grid w-full gap-1 rounded-xl border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11",
        variant === "success" && "gary-alert--success border-state-success/50",
        variant === "warning" && "gary-alert--warning border-state-warning/50",
        variant === "critical" && "gary-alert--critical border-state-critical/50",
        className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 data-slot="alert-title" className={cn("gary-alert__title mb-1 font-medium leading-none tracking-tight", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("gary-alert__description text-sm opacity-80", className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
