import * as React from "react";
import { Slot } from "radix-ui";
import { Label } from "./label";
type FieldContextValue = {
    id: string;
    error?: string | boolean;
};
declare function useField(): FieldContextValue;
interface FieldProps extends React.ComponentProps<"div"> {
    error?: string | boolean;
}
declare function Field({ className, error, ...props }: FieldProps): React.JSX.Element;
declare function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>): React.JSX.Element;
declare function FieldControl({ ...props }: React.ComponentProps<typeof Slot.Root>): React.JSX.Element;
declare function FieldDescription({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element;
declare function FieldMessage({ className, children, ...props }: React.ComponentProps<"p">): React.JSX.Element | null;
export { Field, FieldControl, FieldDescription, FieldLabel, FieldMessage, useField };
//# sourceMappingURL=field.d.ts.map