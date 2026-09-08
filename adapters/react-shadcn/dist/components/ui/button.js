import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "../../lib/utils";
const buttonVariants = cva("gary-button group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
    variants: {
        variant: {
            default: "gary-button--primary",
            outline: "gary-button--outline",
            secondary: "gary-button--secondary",
            ghost: "gary-button--ghost",
            destructive: "gary-button--destructive",
            link: "gary-button--link",
        },
        size: {
            default: "h-10 gap-2 rounded-full px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
            xs: "h-7 gap-1 rounded-full px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
            sm: "h-9 gap-1.5 rounded-full px-4 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
            lg: "h-12 gap-2 rounded-full px-6 text-[0.9375rem]",
            icon: "size-10 rounded-full",
            "icon-xs": "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3",
            "icon-sm": "size-9 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
            "icon-lg": "size-12 rounded-full",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
    const Comp = asChild ? Slot.Root : "button";
    return (_jsx(Comp, { "data-slot": "button", "data-variant": variant, "data-size": size, className: cn(buttonVariants({ variant, size, className })), ...props }));
}
export { Button, buttonVariants };
//# sourceMappingURL=button.js.map