import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Record } from "reicon-react"
import { cn } from "../../lib/utils"
import { useSpringStyle } from "../../lib/use-spring-style"

const Menubar = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root ref={ref} data-slot="menubar" className={cn("gary-menubar flex h-9 items-center gap-1 rounded-xl border bg-background p-1", className)} {...props} />
))
Menubar.displayName = "Menubar"

const MenubarMenu = MenubarPrimitive.Menu
const MenubarTrigger = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger ref={ref} data-slot="menubar-trigger" className={cn("flex cursor-default select-none items-center rounded-md px-3 py-1 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent", className)} {...props} />
))
MenubarTrigger.displayName = "MenubarTrigger"

const MenubarContent = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", alignOffset = -4, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  React.useImperativeHandle(ref, () => innerRef.current!, [])
  const isOpen = (props as Record<string, unknown>)["data-state"] === "open"

  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0.95,
    styleProp: "transform",
    format: (v) => `scale(${v})`,
    response: 0.2,
    damping: 1.0,
    initialStyle: { transform: "scale(0.95)", opacity: 0 },
  })
  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0,
    styleProp: "opacity",
    response: 0.2,
    damping: 1.0,
  })

  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={innerRef}
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        className={cn("gary-menubar__content z-50 min-w-[12rem] overflow-hidden rounded-xl border p-1 shadow-xl", className)}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
})
MenubarContent.displayName = "MenubarContent"

const MenubarItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item ref={ref} data-slot="menubar-item" className={cn("relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4", inset && "pl-8", className)} {...props} />
))
MenubarItem.displayName = "MenubarItem"

function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return <MenubarPrimitive.Separator data-slot="menubar-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}

export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator }
