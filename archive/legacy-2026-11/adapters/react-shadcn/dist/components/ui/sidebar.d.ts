import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { Separator } from "./separator";
import { TooltipContent } from "./tooltip";
type SidebarContext = {
    state: "expanded" | "collapsed";
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};
declare const SidebarContext: React.Context<SidebarContext | null>;
declare function useSidebar(): SidebarContext;
declare const SidebarProvider: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const Sidebar: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
}, "ref"> & React.RefAttributes<HTMLElement>>;
declare const SidebarTrigger: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLButtonElement> & React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<(props?: ({
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link" | null | undefined;
    size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string> & {
    asChild?: boolean;
}, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const SidebarRail: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const SidebarInset: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare function SidebarHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function SidebarFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>): React.JSX.Element;
declare function SidebarContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function SidebarGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function SidebarGroupLabel({ className, asChild, ...props }: React.ComponentProps<"div"> & {
    asChild?: boolean;
}): React.JSX.Element;
declare function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare const menuVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">): React.JSX.Element;
declare function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">): React.JSX.Element;
declare function SidebarMenuButton({ className, isActive, variant, size, tooltip, ...props }: React.ComponentProps<"button"> & VariantProps<typeof menuVariants> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
}): React.JSX.Element;
declare function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function SidebarMenuSkeleton({ className, showIcon, ...props }: React.ComponentProps<"div"> & {
    showIcon?: boolean;
}): React.JSX.Element | undefined;
export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, menuVariants, useSidebar, };
//# sourceMappingURL=sidebar.d.ts.map