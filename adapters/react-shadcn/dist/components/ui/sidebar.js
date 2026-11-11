import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import { SidebarLeft } from "reicon-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Separator } from "./separator";
import { Sheet, SheetContent } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem"; // w-64
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "4rem"; // w-16
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SidebarContext = React.createContext(null);
function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }
    return context;
}
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(undefined);
    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);
    return !!isMobile;
}
const SidebarProvider = React.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback((value) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
            setOpenProp(openState);
        }
        else {
            _setOpen(openState);
        }
        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }, [setOpenProp, open]);
    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
        return isMobile
            ? setOpenMobile((open) => !open)
            : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);
    // Adds a keyboard shortcut to toggle the sidebar (mod+b / cmd+b).
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
                (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);
    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";
    const contextValue = React.useMemo(() => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
    }), [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]);
    return (_jsx(SidebarContext.Provider, { value: contextValue, children: _jsx("div", { style: {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
                ...style,
            }, className: cn("group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-background", className), ref: ref, ...props, children: children }) }));
});
SidebarProvider.displayName = "SidebarProvider";
const Sidebar = React.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
    if (collapsible === "none") {
        return (_jsx("div", { className: cn("flex h-full w-[var(--sidebar-width)] flex-col bg-card text-foreground", className), ...props, children: children }));
    }
    if (isMobile) {
        return (_jsx(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: _jsx(SheetContent, { "data-sidebar": "sidebar", "data-mobile": "true", className: "w-[var(--sidebar-width-mobile)] bg-card p-0 text-foreground [&>button]:hidden", style: {
                    "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
                }, side: side, children: _jsx("div", { className: "flex h-full w-full flex-col", children: children }) }) }));
    }
    return (_jsxs("div", { className: "group peer hidden text-foreground md:block", "data-state": state, "data-collapsible": state === "collapsed" ? collapsible : "", "data-variant": variant, "data-side": side, children: [_jsx("div", { className: cn("relative h-svh w-[var(--sidebar-width)] bg-transparent transition-[width] ease-linear", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", variant === "floating" || variant === "inset"
                    ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing)*4)]"
                    : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]") }), _jsx("nav", { ref: ref, className: cn("fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] ease-linear md:flex", side === "left"
                    ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
                    : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]", 
                // Adjust the padding for floating and inset variants.
                variant === "floating" || variant === "inset"
                    ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing)*4)]"
                    : "border-r group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]", "bg-card", className), ...props, children: _jsx("div", { "data-sidebar": "sidebar", className: "flex h-full w-full flex-col bg-card group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-border group-data-[variant=floating]:shadow-sm", children: children }) })] }));
});
Sidebar.displayName = "Sidebar";
const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (_jsxs(Button, { ref: ref, "data-sidebar": "trigger", "data-slot": "sidebar-trigger", variant: "ghost", size: "icon", className: cn("size-7", className), onClick: (event) => {
            onClick?.(event);
            toggleSidebar();
        }, ...props, children: [_jsx(SidebarLeft, {}), _jsx("span", { className: "sr-only", children: "Toggle Sidebar" })] }));
});
SidebarTrigger.displayName = "SidebarTrigger";
const SidebarRail = React.forwardRef(({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (_jsx("button", { ref: ref, "data-sidebar": "rail", "aria-label": "Toggle Sidebar", tabIndex: -1, onClick: toggleSidebar, title: "Toggle Sidebar", className: cn("absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex", "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-card [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className), ...props }));
});
SidebarRail.displayName = "SidebarRail";
const SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("main", { ref: ref, "data-slot": "sidebar-inset", className: cn("relative flex min-h-svh flex-1 flex-col bg-background", "peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing)*4)] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[side=right]:ml-2 md:peer-data-[variant=inset]:peer-data-[side=right]:mr-2", className), ...props }));
});
SidebarInset.displayName = "SidebarInset";
function SidebarHeader({ className, ...props }) {
    return (_jsx("div", { "data-sidebar": "header", className: cn("flex flex-col gap-2 p-2", className), ...props }));
}
function SidebarFooter({ className, ...props }) {
    return (_jsx("div", { "data-sidebar": "footer", className: cn("flex flex-col gap-2 p-2", className), ...props }));
}
function SidebarSeparator({ className, ...props }) {
    return (_jsx(Separator, { "data-sidebar": "separator", className: cn("mx-2 w-auto bg-border", className), ...props }));
}
function SidebarContent({ className, ...props }) {
    return (_jsx("div", { "data-sidebar": "content", className: cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className), ...props }));
}
function SidebarGroup({ className, ...props }) {
    return (_jsx("div", { "data-sidebar": "group", className: cn("relative flex w-full min-w-0 flex-col p-2", className), ...props }));
}
function SidebarGroupLabel({ className, asChild = false, ...props }) {
    const Comp = asChild ? Slot.Root : "div";
    return (_jsx(Comp, { "data-sidebar": "group-label", className: cn("flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-foreground/50 outline-none [&>svg]:size-4 [&>svg]:shrink-0", "transition-[margin,opacity] duration-200 ease-linear [&>svg]:text-foreground/50", "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0", className), ...props }));
}
function SidebarGroupContent({ className, ...props }) {
    return (_jsx("div", { "data-sidebar": "group-content", className: cn("w-full text-sm", className), ...props }));
}
const menuVariants = cva("peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none whitespace-nowrap transition-[width,height,padding] focus-visible:ring-2 focus-visible:ring-ring/20 active:bg-muted disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=open]:hover:bg-muted data-[state=open]:hover:text-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0", {
    variants: {
        variant: {
            default: "hover:bg-muted hover:text-foreground data-[active=true]:bg-muted data-[active=true]:font-medium data-[active=true]:text-foreground",
            outline: "bg-muted/50 hover:bg-muted hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground shadow-[0_0_0_1px_var(--color-border)]",
        },
        size: {
            default: "h-8 text-sm",
            sm: "h-7 text-xs",
            lg: "h-8 text-sm group-data-[collapsible=icon]:p-0!",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
function SidebarMenu({ className, ...props }) {
    return (_jsx("ul", { "data-sidebar": "menu", className: cn("flex w-full min-w-0 flex-col gap-1", className), ...props }));
}
function SidebarMenuItem({ className, ...props }) {
    return (_jsx("li", { "data-sidebar": "menu-item", className: cn("group/menu-item relative", className), ...props }));
}
function SidebarMenuButton({ className, isActive, variant = "default", size = "default", tooltip, ...props }) {
    const { isMobile, state } = useSidebar();
    const button = (_jsx(Button, { "data-sidebar": "menu-button", "data-size": size, "data-active": isActive, variant: "ghost", className: cn(menuVariants({ variant, size, className })), ...props }));
    if (!tooltip) {
        return button;
    }
    if (typeof tooltip === "string") {
        tooltip = {
            children: tooltip,
        };
    }
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: button }), _jsx(TooltipContent, { side: "right", align: "center", hidden: state !== "collapsed" || isMobile, ...tooltip })] }));
}
function SidebarMenuBadge({ className, ...props }) {
    return (_jsx("div", { "data-sidebar": "menu-badge", className: cn("pointer-events-none absolute right-1 flex h-5 min-w-5 -translate-y-1/2 top-1/2 items-center justify-center rounded-md px-1 text-xs font-medium text-foreground/50 tabular-nums group-has-data-[sidebar=menu-action]/menu-item:relative group-has-data-[sidebar=menu-action]/menu-item:top-auto group-has-data-[sidebar=menu-action]/menu-item:right-0 group-has-data-[sidebar=menu-action]/menu-item:translate-y-0", className), ...props }));
}
function SidebarMenuSkeleton({ className, showIcon = false, ...props }) {
    const { isMobile } = useSidebar();
    // Random width between 50 to 90%.
    const width = React.useMemo(() => {
        return `${Math.floor(Math.random() * 40) + 50}%`;
    }, []);
    if (!isMobile) {
        return (_jsxs("div", { "data-sidebar": "menu-skeleton", className: cn("flex h-8 items-center gap-2 rounded-md px-2", className), ...props, children: [showIcon && (_jsx(Skeleton, { className: "size-4 rounded-md", "data-sidebar": "menu-skeleton-icon" })), _jsx(Skeleton, { className: "h-4 max-w-[--skeleton-width] flex-1", style: {
                        "--skeleton-width": width,
                    }, "data-sidebar": "menu-skeleton-text" })] }));
    }
}
export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, menuVariants, useSidebar, };
//# sourceMappingURL=sidebar.js.map