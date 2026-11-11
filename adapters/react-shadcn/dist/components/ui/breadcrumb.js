import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ChevronRight, MoreH } from "reicon-react";
import { cn } from "../../lib/utils";
function Breadcrumb({ className, ...props }) {
    return _jsx("nav", { "aria-label": "breadcrumb", "data-slot": "breadcrumb", className: cn("gary-breadcrumb", className), ...props });
}
const BreadcrumbList = React.forwardRef(({ className, ...props }, ref) => (_jsx("ol", { ref: ref, className: cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className), ...props })));
BreadcrumbList.displayName = "BreadcrumbList";
function BreadcrumbItem({ className, ...props }) {
    return _jsx("li", { "data-slot": "breadcrumb-item", className: cn("gary-breadcrumb__item inline-flex items-center gap-1.5", className), ...props });
}
function BreadcrumbLink({ className, ...props }) {
    return _jsx("a", { "data-slot": "breadcrumb-link", className: cn("gary-breadcrumb__link transition-colors hover:text-foreground", className), ...props });
}
function BreadcrumbPage({ className, ...props }) {
    return _jsx("span", { "data-slot": "breadcrumb-page", role: "link", "aria-disabled": "true", "aria-current": "page", className: cn("gary-breadcrumb__page font-normal text-foreground", className), ...props });
}
function BreadcrumbSeparator({ children, className, ...props }) {
    return (_jsx("li", { "data-slot": "breadcrumb-separator", role: "presentation", "aria-hidden": "true", className: cn("gary-breadcrumb__separator", className), ...props, children: children ?? _jsx(ChevronRight, { className: "size-3.5" }) }));
}
function BreadcrumbEllipsis({ className, ...props }) {
    return (_jsxs("span", { "data-slot": "breadcrumb-ellipsis", role: "presentation", "aria-hidden": "true", className: cn("flex size-9 items-center justify-center", className), ...props, children: [_jsx(MoreH, { className: "size-4", weight: "Filled" }), _jsx("span", { className: "sr-only", children: "More" })] }));
}
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis };
//# sourceMappingURL=breadcrumb.js.map