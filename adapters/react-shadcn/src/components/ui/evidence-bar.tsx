import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const evidenceBarVariants = cva("gary-evidence-bar grid min-w-0 gap-2", {
  variants: {
    tone: {
      neutral: "gary-evidence-bar--neutral",
      success: "gary-evidence-bar--success",
      warning: "gary-evidence-bar--warning",
      critical: "gary-evidence-bar--critical",
    },
    size: {
      sm: "rounded-xl px-3 py-2.5",
      default: "rounded-2xl px-4 py-3.5",
    },
  },
  defaultVariants: {
    tone: "neutral",
    size: "default",
  },
})

type EvidenceBarProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof evidenceBarVariants> & {
    value: number
    label: React.ReactNode
    detail?: React.ReactNode
    showValue?: boolean
  }

function EvidenceBar({
  className,
  value,
  label,
  detail,
  showValue = true,
  tone = "neutral",
  size = "default",
  "aria-label": ariaLabel,
  ...props
}: EvidenceBarProps) {
  const normalizedValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0
  const displayValue = Math.round(normalizedValue)

  return (
    <div
      data-slot="evidence-bar"
      data-tone={tone}
      data-size={size}
      data-value={displayValue}
      role="progressbar"
      aria-label={
        ariaLabel ?? (typeof label === "string" ? label : "证据完整度")
      }
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={displayValue}
      className={cn(evidenceBarVariants({ tone, size, className }))}
      {...props}
    >
      <div
        data-slot="evidence-bar-header"
        className="flex min-w-0 items-baseline justify-between gap-3"
      >
        <span
          data-slot="evidence-bar-label"
          className="truncate text-xs font-semibold"
        >
          {label}
        </span>
        {showValue ? (
          <span
            data-slot="evidence-bar-value"
            className="shrink-0 text-xs font-bold tabular-nums"
          >
            {displayValue}%
          </span>
        ) : null}
      </div>
      <span data-slot="evidence-bar-track" aria-hidden="true">
        <span
          data-slot="evidence-bar-indicator"
          style={{ width: `${normalizedValue}%` }}
        />
      </span>
      {detail ? (
        <span
          data-slot="evidence-bar-detail"
          className="text-xs leading-5 opacity-65"
        >
          {detail}
        </span>
      ) : null}
    </div>
  )
}

export { EvidenceBar, evidenceBarVariants }
export type { EvidenceBarProps }
