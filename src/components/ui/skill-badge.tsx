import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SkillBadgeProps = React.ComponentProps<typeof Badge>

export function SkillBadge({ className, ...props }: SkillBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("bg-transparent text-xs font-medium", className)}
      {...props}
    />
  )
}
