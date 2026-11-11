import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "reicon-react";
import { cn } from "../../lib/utils";
const Accordion = React.forwardRef(({ className, ...props }, ref) => (_jsx(AccordionPrimitive.Root, { ref: ref, "data-slot": "accordion", className: cn("gary-accordion", className), ...props })));
Accordion.displayName = "Accordion";
const AccordionItem = React.forwardRef(({ className, ...props }, ref) => (_jsx(AccordionPrimitive.Item, { ref: ref, "data-slot": "accordion-item", className: cn("gary-accordion-item", className), ...props })));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => (_jsx(AccordionPrimitive.Header, { className: "flex", children: _jsxs(AccordionPrimitive.Trigger, { ref: ref, "data-slot": "accordion-trigger", className: cn("gary-accordion-trigger flex flex-1 items-center justify-between gap-2 py-3 text-left text-sm font-semibold [&[data-state=open]>svg]:rotate-180", className), ...props, children: [children, _jsx(ChevronDown, { className: "size-4 shrink-0 opacity-60 transition-transform" })] }) })));
AccordionTrigger.displayName = "AccordionTrigger";
const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => (_jsx(AccordionPrimitive.Content, { ref: ref, "data-slot": "accordion-content", className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down", ...props, children: _jsx("div", { className: cn("gary-accordion-content pb-3 pt-0", className), children: children }) })));
AccordionContent.displayName = "AccordionContent";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
//# sourceMappingURL=accordion.js.map