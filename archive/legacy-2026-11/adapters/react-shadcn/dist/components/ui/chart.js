import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "../../lib/utils";
const ChartContext = React.createContext(null);
export function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }
    return context;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getValue(obj, path) {
    return path.split(".").reduce((acc, key) => acc != null && typeof acc === "object"
        ? acc[key]
        : undefined, obj);
}
function getPayloadConfigFromPayload(config, payload, key) {
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }
    const payloadObj = payload;
    const payloadPayload = "payload" in payloadObj &&
        typeof payloadObj.payload === "object" &&
        payloadObj.payload !== null
        ? payloadObj.payload
        : payloadObj;
    let configLabelKey = key;
    if (key in payloadObj &&
        typeof payloadObj[key] === "string") {
        configLabelKey = payloadObj[key];
    }
    else if (key in payloadPayload &&
        typeof payloadPayload[key] === "string") {
        configLabelKey = payloadPayload[key];
    }
    return configLabelKey in config
        ? config[configLabelKey]
        : config[key];
}
// ---------------------------------------------------------------------------
// ChartContainer
// ---------------------------------------------------------------------------
function resolveChartStyleVars(config) {
    const vars = {};
    for (const [key, itemConfig] of Object.entries(config)) {
        const color = itemConfig.color || itemConfig.theme?.light;
        if (color) {
            vars[`--color-${key}`] = color;
        }
    }
    return vars;
}
const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
    return (_jsx(ChartContext.Provider, { value: { config }, children: _jsx("div", { "data-slot": "chart", "data-chart": chartId, ref: ref, style: resolveChartStyleVars(config), className: cn("flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden", className), ...props, children: _jsx(ResponsiveContainer, { children: children }) }) }));
});
ChartContainer.displayName = "ChartContainer";
// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
const ChartTooltip = React.forwardRef(({ content = _jsx(ChartTooltipContent, {}), cursor, ...props }, ref) => {
    return (_jsx(Tooltip, { ...{
            ref,
            content,
            cursor: cursor ?? {
                stroke: "var(--border)",
                strokeWidth: 1,
            },
            ...props,
        } }));
});
ChartTooltip.displayName = "ChartTooltip";
const ChartTooltipContent = React.forwardRef(({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName, nameKey, color, }, ref) => {
    const { config } = useChart();
    const tooltipLabel = React.useMemo(() => {
        if (hideLabel || !payload?.length) {
            return null;
        }
        const [item] = payload;
        const key = `${getValue(item, `${nameKey || "name"}`)}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        let value = typeof label === "string"
            ? config[label]?.label || label
            : itemConfig?.label;
        if (labelFormatter) {
            return (_jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, payload) }));
        }
        if (!value) {
            return null;
        }
        return _jsx("div", { className: cn("font-medium", labelClassName), children: value });
    }, [
        label,
        labelFormatter,
        payload,
        hideLabel,
        labelClassName,
        config,
        nameKey,
    ]);
    if (!active || !payload?.length) {
        return null;
    }
    const nestLabel = payload.length === 1 && indicator !== "dot";
    return (_jsxs("div", { ref: ref, className: cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className), children: [!nestLabel ? tooltipLabel : null, _jsx("div", { className: "grid gap-1.5", children: payload.map((item, index) => {
                    const key = `${getValue(item, `${nameKey || item.dataKey || "value"}`)}`;
                    const name = getValue(item, `${nameKey || "name"}`);
                    const itemConfig = getPayloadConfigFromPayload(config, item, key);
                    const payloadFill = (item.payload || {}).fill;
                    const indicatorColor = color || payloadFill || item.color;
                    return (_jsxs("div", { className: cn("flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground", indicator === "dot" && "items-center"), children: [itemConfig?.icon ? (_jsx(itemConfig.icon, {})) : null, !hideIndicator ? (_jsx("div", { className: cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
                                    "h-2.5 w-2.5": indicator === "dot",
                                    "w-1": indicator === "line",
                                    "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                                    "my-0.5": nestLabel && indicator === "dashed",
                                }), style: {
                                    "--color-bg": indicatorColor,
                                    "--color-border": indicatorColor,
                                } })) : null, _jsxs("div", { className: cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center"), children: [_jsxs("div", { className: "grid gap-1.5", children: [nestLabel ? tooltipLabel : null, _jsx("span", { className: "text-muted-foreground", children: (itemConfig?.label || name) })] }), item.value !== undefined && item.value !== null ? (_jsx("span", { className: "font-mono font-medium tabular-nums text-foreground", children: typeof item.value === "number"
                                            ? item.value.toLocaleString()
                                            : item.value })) : null] })] }, `${item.name || item.dataKey || "item"}-${index}`));
                }) })] }));
});
ChartTooltipContent.displayName = "ChartTooltipContent";
const ChartLegend = React.forwardRef(({ content = _jsx(ChartLegendContent, {}), ...props }, ref) => {
    return (_jsx(Legend, { ...{
            ref,
            content,
            verticalAlign: "top",
            ...props,
        } }));
});
ChartLegend.displayName = "ChartLegend";
const ChartLegendContent = React.forwardRef(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart();
    if (!payload?.length) {
        return null;
    }
    return (_jsx("div", { ref: ref, className: cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className), children: payload.map((item) => {
            const key = `${nameKey || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            return (_jsxs("div", { className: "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground", children: [itemConfig?.icon && !hideIcon ? (_jsx(itemConfig.icon, {})) : (_jsx("div", { className: "h-2 w-2 shrink-0 rounded-[2px]", style: {
                            backgroundColor: item.color,
                        } })), itemConfig?.label] }, `${item.value || item.dataKey || "legend-item"}`));
        }) }));
});
ChartLegendContent.displayName = "ChartLegendContent";
// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, };
//# sourceMappingURL=chart.js.map