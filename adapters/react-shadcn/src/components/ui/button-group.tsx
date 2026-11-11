import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonGroupVariants = cva(
  "gary-button-group text-muted-foreground inline-flex items-center rounded-md bg-muted p-1 [&>button]:bg-transparent [&>button]:shadow-none",
  {
    variants: {
      orientation: {
        horizontal: "flex-row flex-wrap gap-1",
        vertical: "flex-col gap-1",
      },
      gap: {
        default: "gap-1",
        sm: "gap-0.5",
        lg: "gap-2",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      gap: "default",
    },
  }
)

type ButtonGroupProps = React.ComponentProps<"div"> &
  VariantProps<typeof buttonGroupVariants>

function ButtonGroup({
  className,
  orientation = "horizontal",
  gap = "default",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      data-slot="button-group"
      data-orientation={orientation}
      role="group"
      className={cn(buttonGroupVariants({ orientation, gap, className }))}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="button-group-separator"
      role="separator"
      aria-orientation="vertical"
      className={cn(
        "gary-button-group-separator bg-border m-1 h-4 w-px shrink-0",
        className
      )}
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="button-group-text"
      className={cn(
        "gary-button-group-text text-muted-foreground px-1 text-sm",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants }
export type { ButtonGroupProps }
