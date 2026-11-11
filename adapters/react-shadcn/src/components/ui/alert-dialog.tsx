import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cn } from "../../lib/utils"
import { useSpringStyle } from "../../lib/use-spring-style"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  React.useImperativeHandle(ref, () => innerRef.current!, [])
  const isOpen = (props as Record<string, unknown>)["data-state"] === "open"

  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0,
    styleProp: "opacity",
    response: 0.25,
    damping: 1.0,
    initialStyle: { opacity: 0 },
  })

  return (
    <AlertDialogPrimitive.Overlay
      ref={innerRef}
      data-slot="alert-dialog-overlay"
      className={cn("gary-alert-dialog__overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
      {...props}
    />
  )
})
AlertDialogOverlay.displayName = "AlertDialogOverlay"

const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  React.useImperativeHandle(ref, () => innerRef.current!, [])
  const isOpen = (props as Record<string, unknown>)["data-state"] === "open"

  // Spring: scale 0.96 → 1 (materialize), keeping the centered translate.
  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0.96,
    styleProp: "transform",
    format: (v) => `translate(-50%, -50%) scale(${v})`,
    response: 0.35,
    damping: 1.0,
    initialStyle: { transform: "translate(-50%, -50%) scale(0.96)", opacity: 0 },
  })

  // Spring: opacity 0 → 1
  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0,
    styleProp: "opacity",
    response: 0.3,
    damping: 1.0,
  })

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={innerRef}
        data-slot="alert-dialog-content"
        className={cn("gary-alert-dialog__content fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg gap-4 rounded-2xl border p-6 shadow-xl sm:rounded-2xl", className)}
        {...props}
      />
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("gary-alert-dialog__header flex flex-col gap-2 text-center sm:text-left", className)} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("gary-alert-dialog__footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

const AlertDialogTitle = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} data-slot="alert-dialog-title" className={cn("gary-alert-dialog__title text-lg font-semibold", className)} {...props} />
))
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} data-slot="alert-dialog-description" className={cn("gary-alert-dialog__description text-sm opacity-70", className)} {...props} />
))
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = AlertDialogPrimitive.Action
const AlertDialogCancel = AlertDialogPrimitive.Cancel

export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel }
