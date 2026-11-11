import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "../../lib/utils"
import { useSpringStyle } from "../../lib/use-spring-style"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)

  // Merge forwarded ref with inner ref
  React.useImperativeHandle(ref, () => innerRef.current!, [])

  const isOpen = (props as Record<string, unknown>)["data-state"] === "open"

  // Spring: scale 0.95 → 1 (materialize). transform-origin is set by Radix.
  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0.95,
    styleProp: "transform",
    format: (v) => `scale(${v})`,
    response: 0.25,
    damping: 1.0,
    initialStyle: { transform: "scale(0.95)", opacity: 0 },
  })

  // Spring: opacity 0 → 1
  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0,
    styleProp: "opacity",
    response: 0.25,
    damping: 1.0,
  })

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={innerRef}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn("gary-popover__content z-50 w-72 rounded-xl border bg-background p-4 shadow-xl outline-none", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
