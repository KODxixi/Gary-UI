import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import {} from "class-variance-authority";
import { cn } from "../../lib/utils";
import { toggleVariants } from "./toggle";
const ToggleGroupContext = React.createContext({ size: "default", variant: "default" });
const ToggleGroup = React.forwardRef(({ className, variant, size, children, ...props }, ref) => (_jsx(ToggleGroupPrimitive.Root, { ref: ref, "data-slot": "toggle-group", className: cn("flex items-center justify-center gap-1", className), ...props, children: _jsx(ToggleGroupContext.Provider, { value: { variant, size }, children: children }) })));
ToggleGroup.displayName = "ToggleGroup";
const ToggleGroupItem = React.forwardRef(({ className, children, variant, size, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    return (_jsx(ToggleGroupPrimitive.Item, { ref: ref, "data-slot": "toggle-group-item", className: cn(toggleVariants({ variant: context.variant ?? variant, size: context.size ?? size }), className), ...props, children: children }));
});
ToggleGroupItem.displayName = "ToggleGroupItem";
export { ToggleGroup, ToggleGroupItem };
//# sourceMappingURL=toggle-group.js.map