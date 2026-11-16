import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Record } from "reicon-react";
import { cn } from "../../lib/utils";
import { useSpringStyle } from "../../lib/use-spring-style";
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => (_jsxs(DropdownMenuPrimitive.SubTrigger, { ref: ref, "data-slot": "dropdown-menu-sub-trigger", className: cn("gary-dropdown-menu__sub-trigger flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent", inset && "pl-8", className), ...props, children: [children, _jsx(ChevronRight, { className: "ml-auto" })] })));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => {
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
    return (_jsx(DropdownMenuPrimitive.SubContent, { ref: innerRef, "data-slot": "dropdown-menu-sub-content", className: cn("gary-dropdown-menu__sub-content z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1 shadow-xl", className), ...props }));
});
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => {
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
    return (_jsx(DropdownMenuPrimitive.Portal, { children: _jsx(DropdownMenuPrimitive.Content, { ref: innerRef, "data-slot": "dropdown-menu-content", sideOffset: sideOffset, className: cn("gary-dropdown-menu__content z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1 shadow-xl", className), ...props }) }));
});
DropdownMenuContent.displayName = "DropdownMenuContent";
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => (_jsx(DropdownMenuPrimitive.Item, { ref: ref, "data-slot": "dropdown-menu-item", className: cn("gary-dropdown-menu__item relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4", inset && "pl-8", className), ...props })));
DropdownMenuItem.displayName = "DropdownMenuItem";
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (_jsxs(DropdownMenuPrimitive.CheckboxItem, { ref: ref, "data-slot": "dropdown-menu-checkbox-item", className: cn("relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className), checked: checked, ...props, children: [_jsx("span", { className: "absolute left-2 flex size-3.5 items-center justify-center", children: _jsx(DropdownMenuPrimitive.ItemIndicator, { children: _jsx(Check, { className: "size-4" }) }) }), children] })));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(DropdownMenuPrimitive.RadioItem, { ref: ref, "data-slot": "dropdown-menu-radio-item", className: cn("relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className), ...props, children: [_jsx("span", { className: "absolute left-2 flex size-3.5 items-center justify-center", children: _jsx(DropdownMenuPrimitive.ItemIndicator, { children: _jsx(Record, { className: "size-2 fill-current", weight: "Filled" }) }) }), children] })));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";
function DropdownMenuLabel({ className, inset, ...props }) {
    return _jsx(DropdownMenuPrimitive.Label, { "data-slot": "dropdown-menu-label", className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className), ...props });
}
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (_jsx(DropdownMenuPrimitive.Separator, { ref: ref, "data-slot": "dropdown-menu-separator", className: cn("-mx-1 my-1 h-px bg-border", className), ...props })));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
function DropdownMenuShortcut({ className, ...props }) {
    return _jsx("span", { className: cn("ml-auto text-xs tracking-widest opacity-60", className), ...props });
}
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, };
//# sourceMappingURL=dropdown-menu.js.map