import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Record } from "reicon-react";
import { cn } from "../../lib/utils";
const RadioGroup = React.forwardRef(({ className, ...props }, ref) => (_jsx(RadioGroupPrimitive.Root, { ref: ref, "data-slot": "radio-group", className: cn("gary-radio-group grid gap-2", className), ...props })));
RadioGroup.displayName = "RadioGroup";
const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => (_jsx(RadioGroupPrimitive.Item, { ref: ref, "data-slot": "radio-group-item", className: cn("gary-radio-group__item aspect-square size-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className), ...props, children: _jsx(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: _jsx(Record, { className: "size-2.5 fill-current text-current", weight: "Filled" }) }) })));
RadioGroupItem.displayName = "RadioGroupItem";
export { RadioGroup, RadioGroupItem };
//# sourceMappingURL=radio-group.js.map