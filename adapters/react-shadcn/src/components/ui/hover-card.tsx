import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import { cn } from "../../lib/utils"
import { useSpringStyle } from "../../lib/use-spring-style"

const HoverCard = HoverCardPrimitive.Root
const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ComponentRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)

  // Merge forwarded ref with inner ref
  React.useImperativeHandle(ref, () => innerRef.current!, [])

  const isOpen = (props as Record<string, unknown>)["data-state"] === "open"

  // Spring: scale 0.95 → 1. transform-origin is set by Radix.
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
    <HoverCardPrimitive.Content
      ref={innerRef}
      data-slot="hover-card-content"
      align={align}
      sideOffset={sideOffset}
      className={cn("gary-hover-card__content z-50 w-64 rounded-xl border p-4 shadow-xl outline-none", className)}
      {...props}
    />
  )
})
HoverCardContent.displayName = "HoverCardContent"

export { HoverCard, HoverCardTrigger, HoverCardContent }
