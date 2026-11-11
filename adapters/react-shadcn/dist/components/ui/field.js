import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "../../lib/utils";
import { Label } from "./label";
const FieldContext = React.createContext(null);
function useField() {
    const context = React.useContext(FieldContext);
    if (!context) {
        throw new Error("Field components must be used within <Field>");
    }
    return context;
}
function Field({ className, error, ...props }) {
    const id = React.useId();
    const hasError = Boolean(error);
    return (_jsx(FieldContext.Provider, { value: { id, error }, children: _jsx("div", { "data-slot": "field", "data-error": hasError || undefined, "aria-invalid": hasError || undefined, className: cn("gary-field grid gap-1.5", className), ...props }) }));
}
function FieldLabel({ className, ...props }) {
    const { id } = useField();
    return (_jsx(Label, { "data-slot": "field-label", htmlFor: id, className: cn("gary-field__label", className), ...props }));
}
function FieldControl({ ...props }) {
    const { id, error } = useField();
    const hasError = Boolean(error);
    const descriptionId = `${id}-description`;
    const messageId = `${id}-message`;
    return (_jsx(Slot.Root, { "data-slot": "field-control", id: id, "aria-invalid": hasError || undefined, "aria-describedby": hasError ? `${descriptionId} ${messageId}` : descriptionId, ...props }));
}
function FieldDescription({ className, ...props }) {
    const { id } = useField();
    return (_jsx("p", { "data-slot": "field-description", id: `${id}-description`, className: cn("text-sm text-muted-foreground", className), ...props }));
}
function FieldMessage({ className, children, ...props }) {
    const { error, id } = useField();
    const body = typeof error === "string" && error ? error : children;
    if (!body) {
        return null;
    }
    return (_jsx("p", { "data-slot": "field-message", id: `${id}-message`, role: "alert", className: cn("gary-field__message text-sm font-medium text-destructive", className), ...props, children: body }));
}
export { Field, FieldControl, FieldDescription, FieldLabel, FieldMessage, useField };
//# sourceMappingURL=field.js.map