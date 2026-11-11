import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button";
declare function InputGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function InputGroupLeft({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function InputGroupRight({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element;
declare function InputGroupAddon({ className, placement, ...props }: React.ComponentProps<"div"> & {
    placement?: "start" | "end";
}): React.JSX.Element;
declare function InputGroupText({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element;
declare function InputGroupButton({ className, size, ...props }: React.ComponentProps<"button"> & {
    size?: VariantProps<typeof buttonVariants>["size"];
}): React.JSX.Element;
export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupLeft, InputGroupRight, InputGroupText, };
//# sourceMappingURL=input-group.d.ts.map