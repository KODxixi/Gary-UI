import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../lib/utils";
function Kbd({ className, ...props }) {
    return _jsx("kbd", { "data-slot": "kbd", className: cn("gary-kbd inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium", className), ...props });
}
export { Kbd };
//# sourceMappingURL=kbd.js.map