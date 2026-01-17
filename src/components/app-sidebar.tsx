"use client"

import * as React from "react"
import {
  Building,
  Calendar,
  Diamond,
  FolderKanban,
  GalleryVerticalEnd,
  FileText,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const fallbackUser = {
  name: "LSM Member",
  email: "member@lsm.id",
  avatar: "/avatars/rina.png",
}

type SidebarUser = {
  name: string
  email: string
  avatar?: string | null
}

type OrganizationTeam = {
  id: string
  name: string
  plan: string
  avatar_emoji: string
  avatar_color: string
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: SidebarUser
  organizations?: OrganizationTeam[]
  activeOrgId?: string | null
  isAdmin?: boolean
}

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: GalleryVerticalEnd,
      isActive: true,
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: Calendar,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: Diamond,
      items: [
        {
          title: "Participation",
          url: "/dashboard/participation",
        },
      ],
    },
    {
      title: "Tasks",
      url: "/dashboard/tasks",
      icon: FolderKanban,
      items: [
        {
          title: "My tasks",
          url: "/dashboard/tasks/mine",
        },
      ],
    },
    {
      title: "Resources",
      url: "/dashboard/resources",
      icon: FileText,
    },
  ],
}

export function AppSidebar({
  user = fallbackUser,
  organizations = [],
  activeOrgId,
  isAdmin = false,
  ...props
}: AppSidebarProps) {
  const activeOrgName =
    organizations.find((org) => org.id === activeOrgId)?.name ??
    organizations[0]?.name ??
    "Organization"

  const projects = [
    {
      name: "Organization info",
      url: "/dashboard/organization/info",
    },
    {
      name: "Skills",
      url: "/dashboard/organization/skills",
    },
    {
      name: "Tags",
      url: "/dashboard/organization/tags",
    },
    ...(isAdmin ? [{
      name: "Administration",
      url: "/dashboard/organization/administration",
    }] : []),
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={organizations} activeOrgId={activeOrgId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects label={activeOrgName} projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
