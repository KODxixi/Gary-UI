import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"

const chipVariants = cva(
  "gary-chip inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap font-bold",
  {
    variants: {
      variant: {
        soft: "gary-chip--soft",
        solid: "gary-chip--solid",
      },
      tone: {
        neutral: "gary-chip--neutral",
        success: "gary-chip--success",
        warning: "gary-chip--warning",
        critical: "gary-chip--critical",
      },
      size: {
        sm: "min-h-6 gap-1 rounded-full px-2 text-[0.6875rem]",
        default: "min-h-7 gap-1.5 rounded-full px-2.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "soft",
      tone: "neutral",
      size: "default",
    },
  }
)

type ChipProps = React.ComponentProps<"span"> &
  VariantProps<typeof chipVariants> & {
    asChild?: boolean
  }

function Chip({
  className,
  variant = "soft",
  tone = "neutral",
  size = "default",
  asChild = false,
  ...props
}: ChipProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      className={cn(chipVariants({ variant, tone, size, className }))}
      {...props}
    />
  )
}

export { Chip, chipVariants }
export type { ChipProps }
