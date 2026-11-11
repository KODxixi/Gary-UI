import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "reicon-react";
import { cn } from "../../lib/utils";
const defaultClassNames = {
    months: "gary-calendar__months flex flex-col sm:flex-row gap-2",
    month: "gary-calendar__month flex flex-col gap-4",
    month_caption: "gary-calendar__month_caption flex justify-center pt-1 relative items-center w-full",
    caption_label: "gary-calendar__caption_label text-sm font-medium",
    nav: "gary-calendar__nav flex items-center gap-1 absolute inset-x-1 justify-between",
    button_previous: "gary-calendar__button_previous size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
    button_next: "gary-calendar__button_next size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
    month_grid: "gary-calendar__month_grid w-full border-collapse",
    weekdays: "gary-calendar__weekdays flex",
    weekday: "gary-calendar__weekday text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
    week: "gary-calendar__week flex w-full mt-2",
    day: "gary-calendar__day relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
    day_button: "gary-calendar__day_button size-9 rounded-md p-0 font-normal hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100",
    selected: "gary-calendar__selected bg-primary text-primary-foreground rounded-full opacity-100 hover:bg-primary hover:text-primary-foreground",
    today: "gary-calendar__today bg-accent text-accent-foreground",
    outside: "gary-calendar__outside text-muted-foreground opacity-50",
    disabled: "gary-calendar__disabled text-muted-foreground opacity-50",
    range_middle: "gary-calendar__range_middle rounded-none bg-accent text-accent-foreground aria-selected:opacity-100",
    hidden: "gary-calendar__hidden invisible",
};
function Chevron({ orientation = "left", className, style, size, }) {
    const Icon = orientation === "left"
        ? ChevronLeft
        : orientation === "right"
            ? ChevronRight
            : orientation === "up"
                ? ChevronUp
                : ChevronDown;
    return _jsx(Icon, { style: style, size: size, className: cn("size-4", className) });
}
function Calendar({ className, classNames, showOutsideDays = true, mode = "single", components, ...props }) {
    return (_jsx(DayPicker, { ...{
            showOutsideDays,
            mode,
            className: cn("gary-calendar p-3", className),
            classNames: { ...defaultClassNames, ...classNames },
            components: { Chevron, ...components },
            ...props,
        } }));
}
export { Calendar };
//# sourceMappingURL=calendar.js.map