"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
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

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
          
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
