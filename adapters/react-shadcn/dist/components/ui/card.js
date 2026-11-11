import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "../../lib/utils";
const cardVariants = cva("gary-card group/card flex flex-col overflow-hidden text-sm text-card-foreground", {
    variants: {
        material: {
            regular: "gary-card--regular",
            thick: "gary-card--thick",
        },
        size: {
            default: "gap-5 rounded-[var(--gary-radius-card)] p-6",
            sm: "gap-4 rounded-[calc(var(--gary-radius-card)*0.82)] p-5",
        },
    },
    defaultVariants: {
        material: "regular",
        size: "default",
    },
});
function Card({ className, material = "regular", size = "default", asChild = false, ...props }) {
    const Comp = asChild ? Slot.Root : "div";
    return (_jsx(Comp, { "data-slot": "card", "data-material": material, "data-size": size, className: cn(cardVariants({ material, size, className })), ...props }));
}
function CardHeader({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-header", className: cn("group/card-header grid auto-rows-min items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]", className), ...props }));
}
function CardTitle({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-title", className: cn("text-lg leading-snug font-bold text-balance group-data-[size=sm]/card:text-base", className), ...props }));
}
function CardDescription({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-description", className: cn("max-w-[62ch] text-sm leading-[1.7] text-muted-foreground", className), ...props }));
}
function CardAction({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-action", className: cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className), ...props }));
}
function CardContent({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-content", className: cn("grid gap-3", className), ...props }));
}
function CardFooter({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-footer", className: cn("gary-card-footer flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3", className), ...props }));
}
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, cardVariants, };
//# sourceMappingURL=card.js.map