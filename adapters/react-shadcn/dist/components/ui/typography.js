import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../lib/utils";
function H1({ className, ...props }) {
    return (_jsx("h1", { "data-slot": "typography-h1", className: cn("gary-h1 scroll-m-20 text-foreground text-4xl leading-tight font-extrabold tracking-tight lg:text-5xl", className), ...props }));
}
function H2({ className, ...props }) {
    return (_jsx("h2", { "data-slot": "typography-h2", className: cn("gary-h2 scroll-m-20 border-b border-border pb-2 text-foreground text-3xl leading-tight font-semibold tracking-tight first:mt-0", className), ...props }));
}
function H3({ className, ...props }) {
    return (_jsx("h3", { "data-slot": "typography-h3", className: cn("gary-h3 scroll-m-20 text-foreground text-2xl leading-snug font-semibold tracking-tight", className), ...props }));
}
function H4({ className, ...props }) {
    return (_jsx("h4", { "data-slot": "typography-h4", className: cn("gary-h4 scroll-m-20 text-foreground text-xl leading-snug font-semibold tracking-tight", className), ...props }));
}
function Lead({ className, ...props }) {
    return (_jsx("p", { "data-slot": "typography-lead", className: cn("gary-lead text-muted-foreground text-xl", className), ...props }));
}
function P({ className, ...props }) {
    return (_jsx("p", { "data-slot": "typography-p", className: cn("gary-p text-foreground leading-7 [&:not(:first-child)]:mt-6", className), ...props }));
}
function Small({ className, ...props }) {
    return (_jsx("small", { "data-slot": "typography-small", className: cn("gary-small text-foreground text-sm leading-none font-medium", className), ...props }));
}
function Muted({ className, ...props }) {
    return (_jsx("p", { "data-slot": "typography-muted", className: cn("gary-muted text-muted-foreground text-sm", className), ...props }));
}
function Blockquote({ className, ...props }) {
    return (_jsx("blockquote", { "data-slot": "typography-blockquote", className: cn("gary-blockquote text-foreground mt-6 border-l-2 pl-6 italic", className), ...props }));
}
function InlineCode({ className, ...props }) {
    return (_jsx("code", { "data-slot": "typography-inline-code", className: cn("gary-inline-code text-foreground bg-muted rounded px-1 py-0.5 font-mono text-sm", className), ...props }));
}
function List({ className, ...props }) {
    return (_jsx("ul", { "data-slot": "typography-list", className: cn("gary-list text-foreground my-6 ml-6 list-disc [&>li]:mt-2", className), ...props }));
}
function ListItem({ className, ...props }) {
    return (_jsx("li", { "data-slot": "typography-list-item", className: cn("gary-list-item text-foreground leading-7", className), ...props }));
}
function TableCaption({ className, ...props }) {
    return (_jsx("caption", { "data-slot": "typography-caption", className: cn("gary-caption text-muted-foreground mt-4 text-sm", className), ...props }));
}
export { H1, H2, H3, H4, Lead, P, Small, Muted, Blockquote, InlineCode, List, ListItem, TableCaption, };
//# sourceMappingURL=typography.js.map