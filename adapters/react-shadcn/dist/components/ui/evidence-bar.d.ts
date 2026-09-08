import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const evidenceBarVariants: (props?: ({
    tone?: "neutral" | "success" | "warning" | "critical" | null | undefined;
    size?: "default" | "sm" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type EvidenceBarProps = Omit<React.ComponentProps<"div">, "children"> & VariantProps<typeof evidenceBarVariants> & {
    value: number;
    label: React.ReactNode;
    detail?: React.ReactNode;
    showValue?: boolean;
};
declare function EvidenceBar({ className, value, label, detail, showValue, tone, size, "aria-label": ariaLabel, ...props }: EvidenceBarProps): React.JSX.Element;
export { EvidenceBar, evidenceBarVariants };
export type { EvidenceBarProps };
//# sourceMappingURL=evidence-bar.d.ts.map