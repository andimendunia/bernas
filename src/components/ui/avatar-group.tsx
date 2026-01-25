import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type AvatarGroupItem = {
  id: string
  name: string
  imageUrl?: string | null
}

type AvatarGroupProps = {
  items: AvatarGroupItem[]
  max?: number
}

const getInitials = (name: string) => {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function AvatarGroup({ items, max = 5 }: AvatarGroupProps) {
  if (items.length === 0) return null
  const visibleItems = items.slice(0, max)
  const overflow = items.length - visibleItems.length

  return (
    <div className="flex items-center -space-x-2">
      {visibleItems.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <Avatar className="size-8 ring-2 ring-background">
              <AvatarImage src={item.imageUrl ?? undefined} alt={item.name} />
              <AvatarFallback className="text-xs">
                {getInitials(item.name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{item.name}</TooltipContent>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="size-8 ring-2 ring-background">
              <AvatarFallback className="text-xs">+{overflow}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{overflow} more</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
