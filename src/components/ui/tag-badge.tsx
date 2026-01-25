import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TAG_FALLBACK_COLOR = "#f2b5b5"

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(0, 0, 0, ${alpha})`
}

type TagBadgeProps = React.ComponentProps<typeof Badge> & {
  tagColor?: string | null
}

export function TagBadge({ tagColor, className, style, ...props }: TagBadgeProps) {
  const baseColor = tagColor ?? TAG_FALLBACK_COLOR
  return (
    <Badge
      className={cn("border-0 text-[10px] font-semibold", className)}
      style={{
        backgroundColor: hexToRgba(baseColor, 0.18),
        color: baseColor,
        ...style,
      }}
      {...props}
    />
  )
}
