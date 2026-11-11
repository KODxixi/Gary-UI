import * as React from "react"
import { ResponsiveContainer, Tooltip, Legend } from "recharts"

import { cn } from "../../lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChartConfig = Record<
  string,
  {
    label?: string
    color?: string
    icon?: React.ComponentType
    theme?: {
      light?: string
      dark?: string
    }
  }
>

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split(".").reduce<unknown>(
    (acc, key) =>
      acc != null && typeof acc === "object"
        ? (acc as Record<string, unknown>)[key]
        : undefined,
    obj
  )
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadObj = payload as Record<string, unknown>
  const payloadPayload =
    "payload" in payloadObj &&
    typeof payloadObj.payload === "object" &&
    payloadObj.payload !== null
      ? (payloadObj.payload as Record<string, unknown>)
      : payloadObj

  let configLabelKey = key

  if (
    key in payloadObj &&
    typeof payloadObj[key] === "string"
  ) {
    configLabelKey = payloadObj[key] as string
  } else if (
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key]
}

// ---------------------------------------------------------------------------
// ChartContainer
// ---------------------------------------------------------------------------

function resolveChartStyleVars(config: ChartConfig): React.CSSProperties {
  const vars: Record<string, string> = {}
  for (const [key, itemConfig] of Object.entries(config)) {
    const color = itemConfig.color || itemConfig.theme?.light
    if (color) {
      vars[`--color-${key}`] = color
    }
  }
  return vars as React.CSSProperties
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<typeof ResponsiveContainer>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        ref={ref}
        style={resolveChartStyleVars(config)}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Tooltip>, "content" | "cursor"> & {
    content?: React.ReactElement
    cursor?: boolean | Record<string, unknown>
  }
>(({ content = <ChartTooltipContent />, cursor, ...props }, ref) => {
  return (
    <Tooltip
      {...({
        ref,
        content,
        cursor:
          cursor ?? {
            stroke: "var(--border)",
            strokeWidth: 1,
          },
        ...props,
      } as unknown as React.ComponentProps<typeof Tooltip>)}
    />
  )
})
ChartTooltip.displayName = "ChartTooltip"

interface ChartTooltipPayloadItem {
  dataKey?: string | number
  name?: string
  value?: number | string
  color?: string
  payload?: unknown
  [key: string]: unknown
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: ChartTooltipPayloadItem[]
  label?: string | number
  className?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  labelClassName?: string
  labelFormatter?: (
    label: React.ReactNode,
    payload: ChartTooltipPayloadItem[]
  ) => React.ReactNode
  nameKey?: string
  color?: string
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      nameKey,
      color,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${getValue(item, `${nameKey || "name"}`)}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      let value =
        typeof label === "string"
          ? (config[label]?.label as string | undefined) || label
          : (itemConfig?.label as React.ReactNode)

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      nameKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${getValue(
              item,
              `${nameKey || item.dataKey || "value"}`
            )}`
            const name = getValue(item, `${nameKey || "name"}`)
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const payloadFill = (
              (item.payload as Record<string, unknown> | null) || {}
            ).fill
            const indicatorColor =
              color || payloadFill || item.color

            return (
              <div
                key={`${item.name || item.dataKey || "item"}-${index}`}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {itemConfig?.icon ? (
                  <itemConfig.icon />
                ) : null}
                {!hideIndicator ? (
                  <div
                    className={cn(
                      "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                      {
                        "h-2.5 w-2.5": indicator === "dot",
                        "w-1": indicator === "line",
                        "w-0 border-[1.5px] border-dashed bg-transparent":
                          indicator === "dashed",
                        "my-0.5": nestLabel && indicator === "dashed",
                      }
                    )}
                    style={
                      {
                        "--color-bg": indicatorColor,
                        "--color-border": indicatorColor,
                      } as React.CSSProperties
                    }
                  />
                ) : null}
                <div
                  className={cn(
                    "flex flex-1 justify-between leading-none",
                    nestLabel ? "items-end" : "items-center"
                  )}
                >
                  <div className="grid gap-1.5">
                    {nestLabel ? tooltipLabel : null}
                    <span className="text-muted-foreground">
                      {(itemConfig?.label || name) as React.ReactNode}
                    </span>
                  </div>
                  {item.value !== undefined && item.value !== null ? (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {typeof item.value === "number"
                        ? item.value.toLocaleString()
                        : item.value}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

interface ChartLegendPayloadItem {
  value?: string
  color?: string
  dataKey?: string | number
  [key: string]: unknown
}

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Legend>, "content"> & {
    content?: React.ReactElement
  }
>(({ content = <ChartLegendContent />, ...props }, ref) => {
  return (
    <Legend
      {...({
        ref,
        content,
        verticalAlign: "top",
        ...props,
      } as unknown as React.ComponentProps<typeof Legend>)}
    />
  )
})
ChartLegend.displayName = "ChartLegend"

interface ChartLegendContentProps {
  className?: string
  hideIcon?: boolean
  payload?: ChartLegendPayloadItem[]
  verticalAlign?: "top" | "bottom" | "middle"
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={`${item.value || item.dataKey || "legend-item"}`}
              className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
