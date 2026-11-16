import * as React from "react"
import { Calendar as CalendarIcon } from "reicon-react"
import type { DateRange } from "react-day-picker"

import { cn } from "../../lib/utils"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"

function formatDate(date: Date | undefined): string {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}/${m}/${d}`
}

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

function DatePicker({
  value,
  onChange,
  placeholder = "选择日期",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon />
          {value ? formatDate(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            if (date) setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

function DatePickerWithRange({
  value,
  onChange,
  placeholder = "选择日期范围",
  className,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false)
  const label =
    value?.from && value?.to
      ? `${formatDate(value.from)} - ${formatDate(value.to)}`
      : value?.from
        ? formatDate(value.from)
        : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !label && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon />
          {label ? label : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={(range) => {
            onChange?.(range)
            if (range?.from && range?.to) setOpen(false)
          }}
          numberOfMonths={2}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DatePickerWithRange }
