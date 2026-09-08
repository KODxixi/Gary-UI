import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const cardVariants: (props?: ({
    material?: "regular" | "thick" | null | undefined;
    size?: "default" | "sm" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants> & {
    asChild?: boolean;
};
declare function Card({ className, material, size, asChild, ...props }: CardProps): React.JSX.Element;
declare function CardHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function CardTitle({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function CardDescription({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function CardAction({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function CardContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function CardFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, cardVariants, };
export type { CardProps };
//# sourceMappingURL=card.d.ts.map