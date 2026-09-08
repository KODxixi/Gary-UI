import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const chipVariants: (props?: ({
    variant?: "soft" | "solid" | null | undefined;
    tone?: "neutral" | "success" | "warning" | "critical" | null | undefined;
    size?: "default" | "sm" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type ChipProps = React.ComponentProps<"span"> & VariantProps<typeof chipVariants> & {
    asChild?: boolean;
};
declare function Chip({ className, variant, tone, size, asChild, ...props }: ChipProps): React.JSX.Element;
export { Chip, chipVariants };
export type { ChipProps };
//# sourceMappingURL=chip.d.ts.map