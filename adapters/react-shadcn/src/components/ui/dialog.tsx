import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "reicon-react"
import { cn } from "../../lib/utils"
import { useSpringStyle } from "../../lib/use-spring-style"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)

  // Merge forwarded ref with inner ref
  React.useImperativeHandle(ref, () => innerRef.current!, [])

  useSpringStyle(innerRef, (props as Record<string, unknown>)["data-state"] === "open", {
    openValue: 1,
    closedValue: 0,
    styleProp: "opacity",
    response: 0.25,
    damping: 1.0,
    initialStyle: { opacity: 0 },
  })

  return (
    <DialogPrimitive.Overlay
      ref={innerRef}
      data-slot="dialog-overlay"
      className={cn(
        "gary-dialog__overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  const isOpen = (props as Record<string, unknown>)["data-state"] === "open"

  // Merge forwarded ref
  React.useImperativeHandle(ref, () => innerRef.current!, [])

  // Spring: scale from 0.96 → 1 (materialize)
  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0.96,
    styleProp: "transform",
    format: (v) => `translate(-50%, -50%) scale(${v})`,
    response: 0.35,
    damping: 1.0,
    initialStyle: { transform: "translate(-50%, -50%) scale(0.96)", opacity: 0 },
  })

  // Spring: opacity from 0 → 1
  useSpringStyle(innerRef, isOpen, {
    openValue: 1,
    closedValue: 0,
    styleProp: "opacity",
    response: 0.3,
    damping: 1.0,
  })

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={innerRef}
        data-slot="dialog-content"
        className={cn(
          "gary-dialog__content fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg gap-4 rounded-2xl border p-6 shadow-xl",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("gary-dialog__header flex flex-col gap-2 text-center sm:text-left", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("gary-dialog__footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} data-slot="dialog-title" className={cn("gary-dialog__title text-lg font-semibold", className)} {...props} />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} data-slot="dialog-description" className={cn("gary-dialog__description text-sm opacity-70", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

export { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
