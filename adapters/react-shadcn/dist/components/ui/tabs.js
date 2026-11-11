import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";
const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({ className, ...props }, ref) => (_jsx(TabsPrimitive.List, { ref: ref, "data-slot": "tabs-list", className: cn("gary-tabs__list inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className), ...props })));
TabsList.displayName = "TabsList";
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (_jsx(TabsPrimitive.Trigger, { ref: ref, "data-slot": "tabs-trigger", className: cn("gary-tabs__trigger inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className), ...props })));
TabsTrigger.displayName = "TabsTrigger";
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (_jsx(TabsPrimitive.Content, { ref: ref, "data-slot": "tabs-content", className: cn("gary-tabs__content mt-2 focus-visible:outline-none", className), ...props })));
TabsContent.displayName = "TabsContent";
export { Tabs, TabsList, TabsTrigger, TabsContent };
//# sourceMappingURL=tabs.js.map