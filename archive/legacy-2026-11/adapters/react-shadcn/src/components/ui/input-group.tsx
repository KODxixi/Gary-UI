import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "gary-input-group group/input-group flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-transparent px-1 shadow-xs outline-none transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/40",
        "**:data-[slot=input]:h-7 **:data-[slot=input]:min-w-0 **:data-[slot=input]:flex-1 **:data-[slot=input]:rounded-none **:data-[slot=input]:border-0 **:data-[slot=input]:bg-transparent **:data-[slot=input]:px-1 **:data-[slot=input]:shadow-none **:data-[slot=input]:ring-0 **:data-[slot=input]:focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupLeft({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-left"
      data-placement="start"
      className={cn(
        "flex shrink-0 items-center gap-1 pl-1",
        "**:data-[slot=input]:pl-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupRight({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-right"
      data-placement="end"
      className={cn(
        "flex shrink-0 items-center gap-1 pr-1",
        "**:data-[slot=input]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  placement = "start",
  ...props
}: React.ComponentProps<"div"> & { placement?: "start" | "end" }) {
  return (
    <div
      data-slot="input-group-addon"
      data-placement={placement}
      className={cn(
        "flex shrink-0 items-center justify-center gap-1 text-muted-foreground",
        placement === "start" ? "pl-1" : "pr-1",
        className
      )}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("whitespace-nowrap text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  size = "sm",
  ...props
}: React.ComponentProps<"button"> & {
  size?: VariantProps<typeof buttonVariants>["size"]
}) {
  return (
    <button
      data-slot="input-group-button"
      className={cn(buttonVariants({ size }), "h-7 px-2", className)}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupLeft,
  InputGroupRight,
  InputGroupText,
}
