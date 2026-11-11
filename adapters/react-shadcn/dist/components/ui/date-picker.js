import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Calendar as CalendarIcon } from "reicon-react";
import { cn } from "../../lib/utils";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
function formatDate(date) {
    if (!date)
        return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
}
function DatePicker({ value, onChange, placeholder = "选择日期", className, }) {
    const [open, setOpen] = React.useState(false);
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: cn("w-[240px] justify-start text-left font-normal", !value && "text-muted-foreground", className), children: [_jsx(CalendarIcon, {}), value ? formatDate(value) : _jsx("span", { children: placeholder })] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: value, onSelect: (date) => {
                        onChange?.(date);
                        if (date)
                            setOpen(false);
                    }, autoFocus: true }) })] }));
}
function DatePickerWithRange({ value, onChange, placeholder = "选择日期范围", className, }) {
    const [open, setOpen] = React.useState(false);
    const label = value?.from && value?.to
        ? `${formatDate(value.from)} - ${formatDate(value.to)}`
        : value?.from
            ? formatDate(value.from)
            : null;
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { id: "date", variant: "outline", className: cn("w-[300px] justify-start text-left font-normal", !label && "text-muted-foreground", className), children: [_jsx(CalendarIcon, {}), label ? label : _jsx("span", { children: placeholder })] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "range", defaultMonth: value?.from, selected: value, onSelect: (range) => {
                        onChange?.(range);
                        if (range?.from && range?.to)
                            setOpen(false);
                    }, numberOfMonths: 2, autoFocus: true }) })] }));
}
export { DatePicker, DatePickerWithRange };
//# sourceMappingURL=date-picker.js.map