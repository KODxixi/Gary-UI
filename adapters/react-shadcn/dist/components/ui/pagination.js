import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ChevronLeft, ChevronRight, MoreH } from "reicon-react";
import { cn } from "../../lib/utils";
function Pagination({ className, ...props }) {
    return _jsx("nav", { "aria-label": "pagination", "data-slot": "pagination", className: cn("gary-pagination mx-auto flex w-full justify-center", className), ...props });
}
const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (_jsx("ul", { ref: ref, className: "flex flex-row items-center gap-1", ...props })));
PaginationContent.displayName = "PaginationContent";
function PaginationItem({ className, ...props }) {
    return _jsx("li", { "data-slot": "pagination-item", className: cn("gary-pagination__item", className), ...props });
}
const PaginationLink = React.forwardRef(({ className, isActive, size = "default", ...props }, ref) => (_jsx("a", { ref: ref, "aria-current": isActive ? "page" : undefined, "data-slot": "pagination-link", className: cn("gary-pagination__link flex size-9 items-center justify-center rounded-md px-3 text-sm transition-colors", isActive && "bg-primary text-primary-foreground", className), ...props })));
PaginationLink.displayName = "PaginationLink";
function PaginationPrevious({ className, ...props }) {
    return _jsxs(PaginationLink, { "aria-label": "Go to previous page", size: "default", className: cn("gap-1 pl-2.5", className), ...props, children: [_jsx(ChevronLeft, { className: "size-4" }), _jsx("span", { children: "Previous" })] });
}
function PaginationNext({ className, ...props }) {
    return _jsxs(PaginationLink, { "aria-label": "Go to next page", size: "default", className: cn("gap-1 pr-2.5", className), ...props, children: [_jsx("span", { children: "Next" }), _jsx(ChevronRight, { className: "size-4" })] });
}
function PaginationEllipsis({ className, ...props }) {
    return _jsxs("span", { "data-slot": "pagination-ellipsis", "aria-hidden": "true", className: cn("flex size-9 items-center justify-center", className), children: [_jsx(MoreH, { className: "size-4", weight: "Filled" }), _jsx("span", { className: "sr-only", children: "More pages" })] });
}
export { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis };
//# sourceMappingURL=pagination.js.map