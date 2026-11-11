import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "../../lib/utils";
const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(ScrollAreaPrimitive.Root, { ref: ref, "data-slot": "scroll-area", className: cn("gary-scroll-area relative overflow-hidden", className), ...props, children: [_jsx(ScrollAreaPrimitive.Viewport, { className: "gary-scroll-area__viewport size-full rounded-[inherit]", children: children }), _jsx(ScrollBar, {}), _jsx(ScrollAreaPrimitive.Corner, {})] })));
ScrollArea.displayName = "ScrollArea";
const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (_jsx(ScrollAreaPrimitive.ScrollAreaScrollbar, { ref: ref, "data-slot": "scroll-bar", orientation: orientation, className: cn("gary-scroll-area__scrollbar flex touch-none select-none transition-colors", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-px", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-px", className), ...props, children: _jsx(ScrollAreaPrimitive.ScrollAreaThumb, { className: "gary-scroll-area__thumb relative flex-1 rounded-full bg-border" }) })));
ScrollBar.displayName = "ScrollBar";
export { ScrollArea, ScrollBar };
//# sourceMappingURL=scroll-area.js.map