import * as React from "react";
import type { DateRange } from "react-day-picker";
interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}
declare function DatePicker({ value, onChange, placeholder, className, }: DatePickerProps): React.JSX.Element;
interface DatePickerWithRangeProps {
    value?: DateRange;
    onChange?: (range: DateRange | undefined) => void;
    placeholder?: string;
    className?: string;
}
declare function DatePickerWithRange({ value, onChange, placeholder, className, }: DatePickerWithRangeProps): React.JSX.Element;
export { DatePicker, DatePickerWithRange };
//# sourceMappingURL=date-picker.d.ts.map