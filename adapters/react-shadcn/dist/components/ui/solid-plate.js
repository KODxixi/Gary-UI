import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "../../lib/utils";
const solidPlateVariants = cva("gary-solid-plate relative grid min-w-0 text-sm", {
    variants: {
        tone: {
            default: "gary-solid-plate--default",
            subtle: "gary-solid-plate--subtle",
            inverse: "gary-solid-plate--inverse",
        },
        density: {
            compact: "gap-1.5 rounded-xl px-3 py-2.5",
            default: "gap-2 rounded-2xl px-4 py-3.5",
            spacious: "gap-2.5 rounded-[1.125rem] px-5 py-4.5",
        },
    },
    defaultVariants: {
        tone: "default",
        density: "default",
    },
});
function SolidPlate({ className, tone = "default", density = "default", asChild = false, ...props }) {
    const Comp = asChild ? Slot.Root : "div";
    return (_jsx(Comp, { "data-slot": "solid-plate", "data-tone": tone, "data-density": density, className: cn(solidPlateVariants({ tone, density, className })), ...props }));
}
function SolidPlateLabel({ className, ...props }) {
    return (_jsx("span", { "data-slot": "solid-plate-label", className: cn("text-xs leading-5 font-medium opacity-65", className), ...props }));
}
function SolidPlateValue({ className, ...props }) {
    return (_jsx("strong", { "data-slot": "solid-plate-value", className: cn("text-base leading-tight font-bold tabular-nums", className), ...props }));
}
export { SolidPlate, SolidPlateLabel, SolidPlateValue, solidPlateVariants, };
//# sourceMappingURL=solid-plate.js.map