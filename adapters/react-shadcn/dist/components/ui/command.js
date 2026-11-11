import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "reicon-react";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent } from "./dialog";
const Command = React.forwardRef(({ className, ...props }, ref) => (_jsx(CommandPrimitive, { ref: ref, "data-slot": "command", className: cn("gary-command flex h-full w-full flex-col overflow-hidden rounded-xl", className), ...props })));
Command.displayName = "Command";
const CommandInput = React.forwardRef(({ className, ...props }, ref) => (_jsxs("div", { className: "flex items-center gap-2 border-b px-3", "data-slot": "command-input-wrapper", children: [_jsx(Search, { className: "size-4 opacity-60" }), _jsx(CommandPrimitive.Input, { ref: ref, "data-slot": "command-input", autoFocus: true, className: cn("gary-command__input flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className), ...props })] })));
CommandInput.displayName = "CommandInput";
const CommandList = React.forwardRef(({ className, ...props }, ref) => (_jsx(CommandPrimitive.List, { ref: ref, "data-slot": "command-list", className: cn("gary-command__list max-h-[300px] overflow-y-auto overflow-x-hidden", className), ...props })));
CommandList.displayName = "CommandList";
const CommandEmpty = React.forwardRef((props, ref) => (_jsx(CommandPrimitive.Empty, { ref: ref, "data-slot": "command-empty", className: "gary-command__empty py-6 text-center text-sm", ...props })));
CommandEmpty.displayName = "CommandEmpty";
const CommandGroup = React.forwardRef(({ className, ...props }, ref) => (_jsx(CommandPrimitive.Group, { ref: ref, "data-slot": "command-group", className: cn("gary-command__group overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className), ...props })));
CommandGroup.displayName = "CommandGroup";
const CommandItem = React.forwardRef(({ className, ...props }, ref) => (_jsx(CommandPrimitive.Item, { ref: ref, "data-slot": "command-item", className: cn("gary-command__item relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4", className), ...props })));
CommandItem.displayName = "CommandItem";
const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => (_jsx(CommandPrimitive.Separator, { ref: ref, "data-slot": "command-separator", className: cn("-mx-1 h-px bg-border", className), ...props })));
CommandSeparator.displayName = "CommandSeparator";
function CommandDialog({ children, ...props }) {
    return (_jsx(Dialog, { ...props, children: _jsx(DialogContent, { className: "gary-command__dialog overflow-hidden p-0 gap-0 top-[20%] translate-y-0 [&>button]:hidden", children: _jsx(Command, { className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", children: children }) }) }));
}
function CommandShortcut({ className, ...props }) {
    return (_jsx("span", { "data-slot": "command-shortcut", className: cn("gary-command__shortcut ml-auto text-xs text-muted-foreground", className), ...props }));
}
export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandDialog, CommandShortcut, };
//# sourceMappingURL=command.js.map