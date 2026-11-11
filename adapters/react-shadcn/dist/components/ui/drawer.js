import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "../../lib/utils";
import { useSpringStyle } from "../../lib/use-spring-style";
const Drawer = ({ shouldScaleBackground = true, ...props }) => (_jsx(DrawerPrimitive.Root, { "data-slot": "drawer", shouldScaleBackground: shouldScaleBackground, ...props }));
Drawer.displayName = "Drawer";
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;
const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => {
    const innerRef = React.useRef(null);
    React.useImperativeHandle(ref, () => innerRef.current, []);
    useSpringStyle(innerRef, props["data-state"] === "open", {
        openValue: 1,
        closedValue: 0,
        styleProp: "opacity",
        response: 0.25,
        damping: 1.0,
        initialStyle: { opacity: 0 },
    });
    return (_jsx(DrawerPrimitive.Overlay, { ref: innerRef, "data-slot": "drawer-overlay", className: cn("fixed inset-0 z-50 bg-black/60", className), ...props }));
});
DrawerOverlay.displayName = "DrawerOverlay";
const DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(DrawerPortal, { children: [_jsx(DrawerOverlay, {}), _jsxs(DrawerPrimitive.Content, { ref: ref, "data-slot": "drawer-content", className: cn("gary-drawer__content fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl border bg-background", className), ...props, children: [_jsx("div", { className: "mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" }), children] })] })));
DrawerContent.displayName = "DrawerContent";
function DrawerHeader({ className, ...props }) {
    return _jsx("div", { className: cn("gary-drawer__header grid gap-1.5 p-4 text-center sm:text-left", className), ...props });
}
function DrawerFooter({ className, ...props }) {
    return _jsx("div", { className: cn("gary-drawer__footer mt-auto flex flex-col gap-2 p-4", className), ...props });
}
const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(DrawerPrimitive.Title, { ref: ref, "data-slot": "drawer-title", className: cn("gary-drawer__title text-lg font-semibold", className), ...props })));
DrawerTitle.displayName = "DrawerTitle";
const DrawerDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(DrawerPrimitive.Description, { ref: ref, "data-slot": "drawer-description", className: cn("gary-drawer__description text-sm opacity-70", className), ...props })));
DrawerDescription.displayName = "DrawerDescription";
export { Drawer, DrawerTrigger, DrawerPortal, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerOverlay };
//# sourceMappingURL=drawer.js.map