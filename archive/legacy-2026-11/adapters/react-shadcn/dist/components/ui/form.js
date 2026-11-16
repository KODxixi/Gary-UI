import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "radix-ui";
import { Controller, FormProvider, useFormContext, useFormState, } from "react-hook-form";
import { cn } from "../../lib/utils";
import { Label } from "./label";
const Form = FormProvider;
const FormFieldContext = React.createContext({});
const FormField = ({ ...props }) => {
    return (_jsx(FormFieldContext.Provider, { value: { name: props.name }, children: _jsx(Controller, { ...props }) }));
};
const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    const { getFieldState } = useFormContext();
    const formState = useFormState({ name: fieldContext.name });
    const fieldState = getFieldState(fieldContext.name, formState);
    if (!fieldContext) {
        throw new Error("useFormField should be used within <FormField>");
    }
    const { id } = itemContext;
    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    };
};
const FormItemContext = React.createContext({});
function FormItem({ className, ...props }) {
    const id = React.useId();
    return (_jsx(FormItemContext.Provider, { value: { id }, children: _jsx("div", { "data-slot": "form-item", className: cn("gary-form-item grid gap-2", className), ...props }) }));
}
function FormLabel({ className, ...props }) {
    const { error, formItemId } = useFormField();
    return (_jsx(Label, { "data-slot": "form-label", "data-error": !!error, className: cn("data-[error=true]:text-destructive", className), htmlFor: formItemId, ...props }));
}
function FormControl({ ...props }) {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
    return (_jsx(Slot.Root, { "data-slot": "form-control", id: formItemId, "aria-describedby": !error
            ? `${formDescriptionId}`
            : `${formDescriptionId} ${formMessageId}`, "aria-invalid": !!error, ...props }));
}
function FormDescription({ className, ...props }) {
    const { formDescriptionId } = useFormField();
    return (_jsx("p", { "data-slot": "form-description", id: formDescriptionId, className: cn("gary-form-description text-sm text-muted-foreground", className), ...props }));
}
function FormMessage({ className, children, ...props }) {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message ?? "") : children;
    if (!body) {
        return null;
    }
    return (_jsx("p", { "data-slot": "form-message", id: formMessageId, className: cn("gary-form-message text-sm font-medium text-destructive", className), ...props, children: body }));
}
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField, };
//# sourceMappingURL=form.js.map