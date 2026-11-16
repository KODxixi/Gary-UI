import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
function Spinner({ className, ...props }) {
    return (_jsx("span", { role: "status", "aria-label": "Loading", className: cn("gary-spinner inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className), ...props }));
}
export { Spinner };
//# sourceMappingURL=spinner.js.map