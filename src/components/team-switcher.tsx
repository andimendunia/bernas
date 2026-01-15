"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase/client"

export function TeamSwitcher({
  teams,
  activeOrgId,
}: {
  teams: {
    id: string
    name: string
    plan: string
    avatar_emoji: string
    avatar_color: string
  }[]
  activeOrgId?: string | null
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [activeTeam, setActiveTeam] = React.useState(
    teams.find((team) => team.id === activeOrgId) ?? teams[0]
  )
  const [saving, setSaving] = React.useState(false)
  const [initialized, setInitialized] = React.useState(false)

  if (!activeTeam) {
    return null
  }

  React.useEffect(() => {
    const nextTeam = teams.find((team) => team.id === activeOrgId) ?? teams[0]
    if (nextTeam) {
      setActiveTeam(nextTeam)
    }

    if (!activeOrgId && teams[0] && !saving && !initialized) {
      setInitialized(true)
      void handleSwitch(teams[0].id)
    }
  }, [activeOrgId, teams, saving, initialized])

  const handleSwitch = async (teamId: string) => {
    if (saving) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { active_org_id: teamId },
    })

    setSaving(false)

    if (!error) {
      const nextTeam = teams.find((team) => team.id === teamId)
      if (nextTeam) {
        setActiveTeam(nextTeam)
      }
      router.refresh()
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-lg text-base"
                style={{ backgroundColor: activeTeam.avatar_color }}
              >
                <span>{activeTeam.avatar_emoji}</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => handleSwitch(team.id)}
                className="gap-2 p-2"
              >
                <div
                  className="flex size-6 items-center justify-center rounded-md border text-sm"
                  style={{ backgroundColor: team.avatar_color }}
                >
                  <span>{team.avatar_emoji}</span>
                </div>
                {team.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <a href="/onboarding?mode=add" className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add organization
                </div>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
