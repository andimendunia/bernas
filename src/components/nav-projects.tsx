"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavProjects({
  label,
  projects,
}: {
  label: string
  projects: {
    name: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const currentTab = searchParams.get("tab")
          const [itemPath, itemQuery] = item.url.split("?")
          const queryTab = itemQuery?.startsWith("tab=")
            ? itemQuery.replace("tab=", "")
            : null
          const isActive = queryTab
            ? pathname === itemPath && currentTab === queryTab
            : pathname === itemPath && (!currentTab || currentTab === "members")
           
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild size="sm">
                <a 
                  href={item.url}
                  className={cn(isActive && "bg-primary/40 text-foreground")}
                >
                  {item.icon && <item.icon />}
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
