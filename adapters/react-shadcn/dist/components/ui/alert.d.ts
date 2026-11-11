import * as React from "react";
declare function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & {
    variant?: "default" | "success" | "warning" | "critical";
}): React.JSX.Element;
declare function AlertTitle({ className, ...props }: React.ComponentProps<"h5">): React.JSX.Element;
declare function AlertDescription({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
export { Alert, AlertTitle, AlertDescription };
//# sourceMappingURL=alert.d.ts.map