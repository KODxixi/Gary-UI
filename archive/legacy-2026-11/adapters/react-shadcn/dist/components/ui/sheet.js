import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cva } from "class-variance-authority";
import { X } from "reicon-react";
import { cn } from "../../lib/utils";
import { useSpringStyle } from "../../lib/use-spring-style";
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => {
    const innerRef = React.useRef(null);
    React.useImperativeHandle(ref, () => innerRef.current, []);
    const isOpen = props["data-state"] === "open";
    useSpringStyle(innerRef, isOpen, {
        openValue: 1,
        closedValue: 0,
        styleProp: "opacity",
        response: 0.25,
        damping: 1.0,
        initialStyle: { opacity: 0 },
    });
    return (_jsx(DialogPrimitive.Overlay, { ref: innerRef, "data-slot": "sheet-overlay", className: cn("gary-sheet__overlay fixed inset-0 z-50 bg-black/80", className), ...props }));
});
SheetOverlay.displayName = "SheetOverlay";
const sheetVariants = cva("gary-sheet__content fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg", {
    variants: {
        side: {
            top: "inset-x-0 top-0 border-b rounded-b-xl",
            bottom: "inset-x-0 bottom-0 border-t rounded-t-xl",
            left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r sm:max-w-sm",
            right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l sm:max-w-sm",
        },
    },
    defaultVariants: {
        side: "right",
    },
});
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => {
    const innerRef = React.useRef(null);
    React.useImperativeHandle(ref, () => innerRef.current, []);
    const isOpen = props["data-state"] === "open";
    // Slide in from the off-screen edge. closedValue=1 → off-screen 100%,
    // openValue=0 → settled in place. Sign points away from the edge.
    const isHorizontal = side === "left" || side === "right";
    const sign = side === "left" || side === "top" ? -1 : 1;
    const format = (v) => isHorizontal ? `translateX(${sign * v * 100}%)` : `translateY(${sign * v * 100}%)`;
    useSpringStyle(innerRef, isOpen, {
        openValue: 0,
        closedValue: 1,
        styleProp: "transform",
        format,
        response: 0.3,
        damping: 0.8,
        initialStyle: { transform: format(1) },
    });
    return (_jsxs(SheetPortal, { children: [_jsx(SheetOverlay, {}), _jsxs(DialogPrimitive.Content, { ref: innerRef, "data-slot": "sheet-content", "data-side": side, className: cn(sheetVariants({ side }), className), ...props, children: [children, _jsxs(DialogPrimitive.Close, { "data-slot": "sheet-close", className: "absolute right-4 top-4 rounded-lg opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 disabled:pointer-events-none", children: [_jsx(X, { className: "size-4" }), _jsx("span", { className: "sr-only", children: "Close" })] })] })] }));
});
SheetContent.displayName = "SheetContent";
function SheetHeader({ className, ...props }) {
    return (_jsx("div", { className: cn("gary-sheet__header flex flex-col gap-2 text-center sm:text-left", className), ...props }));
}
function SheetFooter({ className, ...props }) {
    return (_jsx("div", { className: cn("gary-sheet__footer mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className), ...props }));
}
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Title, { ref: ref, "data-slot": "sheet-title", className: cn("gary-sheet__title text-lg font-semibold text-foreground", className), ...props })));
SheetTitle.displayName = "SheetTitle";
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Description, { ref: ref, "data-slot": "sheet-description", className: cn("gary-sheet__description text-sm text-muted-foreground", className), ...props })));
SheetDescription.displayName = "SheetDescription";
export { Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, };
//# sourceMappingURL=sheet.js.map