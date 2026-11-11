import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Record } from "reicon-react";
import { cn } from "../../lib/utils";
import { useSpringStyle } from "../../lib/use-spring-style";
const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuPortal = ContextMenuPrimitive.Portal;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
const ContextMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => (_jsxs(ContextMenuPrimitive.SubTrigger, { ref: ref, "data-slot": "context-menu-sub-trigger", className: cn("gary-context-menu__sub-trigger flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:size-4", inset && "pl-8", className), ...props, children: [children, _jsx(ChevronRight, { className: "ml-auto" })] })));
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";
const ContextMenuSubContent = React.forwardRef(({ className, ...props }, ref) => {
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
    return (_jsx(ContextMenuPrimitive.SubContent, { ref: innerRef, "data-slot": "context-menu-sub-content", className: cn("gary-context-menu__sub-content z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1 shadow-xl", className), ...props }));
});
ContextMenuSubContent.displayName = "ContextMenuSubContent";
const ContextMenuContent = React.forwardRef(({ className, ...props }, ref) => {
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
    return (_jsx(ContextMenuPrimitive.Portal, { children: _jsx(ContextMenuPrimitive.Content, { ref: innerRef, "data-slot": "context-menu-content", className: cn("gary-context-menu__content z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1 shadow-xl", className), ...props }) }));
});
ContextMenuContent.displayName = "ContextMenuContent";
const ContextMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => (_jsx(ContextMenuPrimitive.Item, { ref: ref, "data-slot": "context-menu-item", className: cn("gary-context-menu__item relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4", inset && "pl-8", className), ...props })));
ContextMenuItem.displayName = "ContextMenuItem";
const ContextMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (_jsxs(ContextMenuPrimitive.CheckboxItem, { ref: ref, "data-slot": "context-menu-checkbox-item", className: cn("relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className), checked: checked, ...props, children: [_jsx("span", { className: "absolute left-2 flex size-3.5 items-center justify-center", children: _jsx(ContextMenuPrimitive.ItemIndicator, { children: _jsx(Check, { className: "size-4" }) }) }), children] })));
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";
const ContextMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(ContextMenuPrimitive.RadioItem, { ref: ref, "data-slot": "context-menu-radio-item", className: cn("relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className), ...props, children: [_jsx("span", { className: "absolute left-2 flex size-3.5 items-center justify-center", children: _jsx(ContextMenuPrimitive.ItemIndicator, { children: _jsx(Record, { className: "size-2 fill-current", weight: "Filled" }) }) }), children] })));
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";
function ContextMenuLabel({ className, inset, ...props }) {
    return _jsx(ContextMenuPrimitive.Label, { "data-slot": "context-menu-label", className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className), ...props });
}
const ContextMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (_jsx(ContextMenuPrimitive.Separator, { ref: ref, "data-slot": "context-menu-separator", className: cn("-mx-1 my-1 h-px bg-border", className), ...props })));
ContextMenuSeparator.displayName = "ContextMenuSeparator";
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup, };
function ContextMenuShortcut({ className, ...props }) {
    return _jsx("span", { className: cn("ml-auto text-xs tracking-widest opacity-60", className), ...props });
}
//# sourceMappingURL=context-menu.js.map