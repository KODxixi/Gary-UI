import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
const toggleVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground", {
    variants: { variant: { default: "", outline: "border border-transparent shadow-sm" }, size: { default: "h-9 px-2.5", sm: "h-8 px-2", lg: "h-10 px-3" } },
    defaultVariants: { variant: "default", size: "default" },
});
const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => (_jsx(TogglePrimitive.Root, { ref: ref, "data-slot": "toggle", className: cn(toggleVariants({ variant, size, className })), ...props })));
Toggle.displayName = "Toggle";
export { Toggle, toggleVariants };
//# sourceMappingURL=toggle.js.map