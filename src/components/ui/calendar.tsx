"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type CalendarProps = {
  mode?: "single"
  selected?: Date
  onSelect?: (date?: Date) => void
  className?: string
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const value = selected ? selected.toISOString().slice(0, 10) : ""

  return (
    <div className={cn("p-3", className)}>
      <input
        type="date"
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value
          if (!nextValue) {
            onSelect?.(undefined)
            return
          }
          const nextDate = new Date(`${nextValue}T00:00:00`)
          if (!Number.isNaN(nextDate.getTime())) {
            onSelect?.(nextDate)
          }
        }}
        aria-label="Pick a date"
      />
    </div>
  )
}
