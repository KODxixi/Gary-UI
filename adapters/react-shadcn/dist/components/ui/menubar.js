import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Record } from "reicon-react";
import { cn } from "../../lib/utils";
import { useSpringStyle } from "../../lib/use-spring-style";
const Menubar = React.forwardRef(({ className, ...props }, ref) => (_jsx(MenubarPrimitive.Root, { ref: ref, "data-slot": "menubar", className: cn("gary-menubar flex h-9 items-center gap-1 rounded-xl border bg-background p-1", className), ...props })));
Menubar.displayName = "Menubar";
const MenubarMenu = MenubarPrimitive.Menu;
const MenubarTrigger = React.forwardRef(({ className, ...props }, ref) => (_jsx(MenubarPrimitive.Trigger, { ref: ref, "data-slot": "menubar-trigger", className: cn("flex cursor-default select-none items-center rounded-md px-3 py-1 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent", className), ...props })));
MenubarTrigger.displayName = "MenubarTrigger";
const MenubarContent = React.forwardRef(({ className, align = "start", alignOffset = -4, ...props }, ref) => {
    const innerRef = React.useRef(null);
    React.useImperativeHandle(ref, () => innerRef.current, []);
    const isOpen = props["data-state"] === "open";
    useSpringStyle(innerRef, isOpen, {
        openValue: 1,
        closedValue: 0.95,
        styleProp: "transform",
        format: (v) => `scale(${v})`,
        response: 0.2,
        damping: 1.0,
        initialStyle: { transform: "scale(0.95)", opacity: 0 },
    });
    useSpringStyle(innerRef, isOpen, {
        openValue: 1,
        closedValue: 0,
        styleProp: "opacity",
        response: 0.2,
        damping: 1.0,
    });
    return (_jsx(MenubarPrimitive.Portal, { children: _jsx(MenubarPrimitive.Content, { ref: innerRef, "data-slot": "menubar-content", align: align, alignOffset: alignOffset, className: cn("gary-menubar__content z-50 min-w-[12rem] overflow-hidden rounded-xl border p-1 shadow-xl", className), ...props }) }));
});
MenubarContent.displayName = "MenubarContent";
const MenubarItem = React.forwardRef(({ className, inset, ...props }, ref) => (_jsx(MenubarPrimitive.Item, { ref: ref, "data-slot": "menubar-item", className: cn("relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4", inset && "pl-8", className), ...props })));
MenubarItem.displayName = "MenubarItem";
function MenubarSeparator({ className, ...props }) {
    return _jsx(MenubarPrimitive.Separator, { "data-slot": "menubar-separator", className: cn("-mx-1 my-1 h-px bg-border", className), ...props });
}
export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator };
//# sourceMappingURL=menubar.js.map