import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
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
});
function EvidenceBar({ className, value, label, detail, showValue = true, tone = "neutral", size = "default", "aria-label": ariaLabel, ...props }) {
    const normalizedValue = Number.isFinite(value)
        ? Math.min(100, Math.max(0, value))
        : 0;
    const displayValue = Math.round(normalizedValue);
    return (_jsxs("div", { "data-slot": "evidence-bar", "data-tone": tone, "data-size": size, "data-value": displayValue, role: "progressbar", "aria-label": ariaLabel ?? (typeof label === "string" ? label : "证据完整度"), "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": displayValue, className: cn(evidenceBarVariants({ tone, size, className })), ...props, children: [_jsxs("div", { "data-slot": "evidence-bar-header", className: "flex min-w-0 items-baseline justify-between gap-3", children: [_jsx("span", { "data-slot": "evidence-bar-label", className: "truncate text-xs font-semibold", children: label }), showValue ? (_jsxs("span", { "data-slot": "evidence-bar-value", className: "shrink-0 text-xs font-bold tabular-nums", children: [displayValue, "%"] })) : null] }), _jsx("span", { "data-slot": "evidence-bar-track", "aria-hidden": "true", children: _jsx("span", { "data-slot": "evidence-bar-indicator", style: { width: `${normalizedValue}%` } }) }), detail ? (_jsx("span", { "data-slot": "evidence-bar-detail", className: "text-xs leading-5 opacity-65", children: detail })) : null] }));
}
export { EvidenceBar, evidenceBarVariants };
//# sourceMappingURL=evidence-bar.js.map