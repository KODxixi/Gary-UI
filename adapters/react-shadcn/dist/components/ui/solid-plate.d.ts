import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const solidPlateVariants: (props?: ({
    tone?: "default" | "subtle" | "inverse" | null | undefined;
    density?: "default" | "compact" | "spacious" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type SolidPlateProps = React.ComponentProps<"div"> & VariantProps<typeof solidPlateVariants> & {
    asChild?: boolean;
};
declare function SolidPlate({ className, tone, density, asChild, ...props }: SolidPlateProps): React.JSX.Element;
declare function SolidPlateLabel({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
declare function SolidPlateValue({ className, ...props }: React.ComponentProps<"strong">): React.JSX.Element;
export { SolidPlate, SolidPlateLabel, SolidPlateValue, solidPlateVariants, };
export type { SolidPlateProps };
//# sourceMappingURL=solid-plate.d.ts.map