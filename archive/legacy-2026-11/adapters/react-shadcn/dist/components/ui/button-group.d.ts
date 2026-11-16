import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const buttonGroupVariants: (props?: ({
    orientation?: "horizontal" | "vertical" | null | undefined;
    gap?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type ButtonGroupProps = React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>;
declare function ButtonGroup({ className, orientation, gap, ...props }: ButtonGroupProps): React.JSX.Element;
declare function ButtonGroupSeparator({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function ButtonGroupText({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
export type { ButtonGroupProps };
//# sourceMappingURL=button-group.d.ts.map