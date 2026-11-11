import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";
import { useSpringStyle } from "../../lib/use-spring-style";
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => {
    const innerRef = React.useRef(null);
    // Merge forwarded ref with inner ref
    React.useImperativeHandle(ref, () => innerRef.current, []);
    const isOpen = props["data-state"] === "open";
    // Spring: scale 0.95 → 1. transform-origin is set by Radix.
    useSpringStyle(innerRef, isOpen, {
        openValue: 1,
        closedValue: 0.95,
        styleProp: "transform",
        format: (v) => `scale(${v})`,
        response: 0.25,
        damping: 1.0,
        initialStyle: { transform: "scale(0.95)", opacity: 0 },
    });
    // Spring: opacity 0 → 1
    useSpringStyle(innerRef, isOpen, {
        openValue: 1,
        closedValue: 0,
        styleProp: "opacity",
        response: 0.25,
        damping: 1.0,
    });
    return (_jsx(TooltipPrimitive.Portal, { children: _jsx(TooltipPrimitive.Content, { ref: innerRef, "data-slot": "tooltip-content", sideOffset: sideOffset, className: cn("gary-tooltip__content z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md", className), ...props }) }));
});
TooltipContent.displayName = "TooltipContent";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
//# sourceMappingURL=tooltip.js.map