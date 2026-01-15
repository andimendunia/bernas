"use client"

import * as React from "react"
import {
  Building,
  Calendar,
  Diamond,
  FolderKanban,
  GalleryVerticalEnd,
  Link,
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
          title: "All events",
          url: "/dashboard/events",
        },
        {
          title: "Event tags",
          url: "/dashboard/events/tags",
        },
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
          title: "All tasks",
          url: "/dashboard/tasks",
        },
        {
          title: "My tasks",
          url: "/dashboard/tasks/mine",
        },
      ],
    },
    {
      title: "Repository",
      url: "/dashboard/repository",
      icon: Link,
    },
  ],
  projects: [
    {
      name: "Member",
      url: "/dashboard/organization/members",
      icon: Users,
    },
  ],
}

export function AppSidebar({
  user = fallbackUser,
  organizations = [],
  activeOrgId,
  ...props
}: AppSidebarProps) {
  const activeOrgName =
    organizations.find((org) => org.id === activeOrgId)?.name ??
    organizations[0]?.name ??
    "Organization"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={organizations} activeOrgId={activeOrgId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects label={activeOrgName} projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
