import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "reicon-react";
import { cn } from "../../lib/utils";
const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => (_jsx(OTPInput, { ref: ref, containerClassName: cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName), className: cn("disabled:cursor-not-allowed", className), ...props })));
InputOTP.displayName = "InputOTP";
const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, "data-slot": "input-otp-group", className: cn("flex items-center", className), ...props })));
InputOTPGroup.displayName = "InputOTPGroup";
const InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext?.slots?.[index] ?? {};
    return (_jsxs("div", { ref: ref, "data-slot": "input-otp-slot", className: cn("relative flex size-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md", isActive && "z-10 ring-1 ring-ring", className), ...props, children: [char, hasFakeCaret && _jsx("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "h-4 w-px animate-caret-blink bg-foreground" }) })] }));
});
InputOTPSlot.displayName = "InputOTPSlot";
const InputOTPSeparator = React.forwardRef(({ ...props }, ref) => (_jsx("div", { ref: ref, "data-slot": "input-otp-separator", role: "separator", ...props, children: _jsx(Minus, {}) })));
InputOTPSeparator.displayName = "InputOTPSeparator";
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
//# sourceMappingURL=input-otp.js.map