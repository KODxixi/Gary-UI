import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"
import { Label } from "./label"

type FieldContextValue = {
  id: string
  error?: string | boolean
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

function useField() {
  const context = React.useContext(FieldContext)

  if (!context) {
    throw new Error("Field components must be used within <Field>")
  }

  return context
}

interface FieldProps extends React.ComponentProps<"div"> {
  error?: string | boolean
}

function Field({ className, error, ...props }: FieldProps) {
  const id = React.useId()
  const hasError = Boolean(error)

  return (
    <FieldContext.Provider value={{ id, error }}>
      <div
        data-slot="field"
        data-error={hasError || undefined}
        aria-invalid={hasError || undefined}
        className={cn("gary-field grid gap-1.5", className)}
        {...props}
      />
    </FieldContext.Provider>
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { id } = useField()

  return (
    <Label
      data-slot="field-label"
      htmlFor={id}
      className={cn("gary-field__label", className)}
      {...props}
    />
  )
}

function FieldControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { id, error } = useField()
  const hasError = Boolean(error)
  const descriptionId = `${id}-description`
  const messageId = `${id}-message`

  return (
    <Slot.Root
      data-slot="field-control"
      id={id}
      aria-invalid={hasError || undefined}
      aria-describedby={
        hasError ? `${descriptionId} ${messageId}` : descriptionId
      }
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { id } = useField()

  return (
    <p
      data-slot="field-description"
      id={`${id}-description`}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldMessage({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  const { error, id } = useField()
  const body = typeof error === "string" && error ? error : children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="field-message"
      id={`${id}-message`}
      role="alert"
      className={cn("gary-field__message text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export { Field, FieldControl, FieldDescription, FieldLabel, FieldMessage, useField }
