import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "reicon-react";
import { cn } from "../../lib/utils";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => (_jsx(CheckboxPrimitive.Root, { ref: ref, "data-slot": "checkbox", className: cn("gary-checkbox peer flex size-4 shrink-0 items-center justify-center rounded border border-input shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className), ...props, children: _jsx(CheckboxPrimitive.Indicator, { "data-slot": "checkbox-indicator", className: cn("flex items-center justify-center text-current"), children: _jsx(Check, { className: "size-3.5" }) }) })));
Checkbox.displayName = "Checkbox";
export { Checkbox };
//# sourceMappingURL=checkbox.js.map