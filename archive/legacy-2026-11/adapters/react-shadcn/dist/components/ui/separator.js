import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../../lib/utils";
const Separator = React.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (_jsx(SeparatorPrimitive.Root, { ref: ref, "data-slot": "separator", decorative: decorative, orientation: orientation, className: cn("gary-separator shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className), ...props })));
Separator.displayName = "Separator";
export { Separator };
//# sourceMappingURL=separator.js.map