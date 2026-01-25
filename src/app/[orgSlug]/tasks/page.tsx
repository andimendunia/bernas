import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AllTasksWrapper } from "@/components/tasks/all-tasks-wrapper"
import type {
  TaskWithEvent,
} from "@/components/tasks/all-tasks"
import type {
  EventOrgMember,
  EventSkill,
} from "@/components/events/event-detail"
import type { EventParticipation } from "@/components/tasks/task-types"
import { getOrgMembers } from "@/lib/permissions-server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "All tasks",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

type TasksPageProps = {
  params: Promise<{ orgSlug: string }>
}

type RawSkillLink = {
  skill_id: string
  skills: EventSkill | EventSkill[] | null
}

type TaskRow = Omit<TaskWithEvent, "org_members" | "task_skill_links" | "events"> & {
  task_skill_links?: RawSkillLink[]
  events: { id: string; name: string } | { id: string; name: string }[] | null
}

type ParticipationRow = {
  event_id: string
  member_id: string
  status: "full" | "partial" | "declined" | null
}

type EventSkillRow = {
  event_id: string
  skill_id: string
  skills: EventSkill | EventSkill[] | null
}

type EventSummary = { id: string; name: string }

function normalizeSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function TasksPage({ params }: TasksPageProps) {
  const { orgSlug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    redirect("/auth/sign-in")
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .single()

  if (!org) {
    redirect("/onboarding")
  }

  const [
    orgMembersResult,
    tasksResult,
    skillsResult,
    eventsResult,
    eventSkillsResult,
    participationsResult,
    canCreateTasksResult,
    canEditTasksResult,
    canDeleteTasksResult,
  ] = await Promise.all([
    getOrgMembers(org.id),
    supabase
      .from("tasks")
      .select(
        `
          id,
          title,
          description,
          status,
          deadline,
          event_id,
          assignee_member_id,
          created_at,
          updated_at,
          events (id, name),
          task_skill_links (
            skill_id,
            skills (id, name, description, color)
          )
        `
      )
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("skills")
      .select("id, name, description, color")
      .eq("org_id", org.id)
      .order("name"),
    supabase
      .from("events")
      .select("id, name")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_skill_links")
      .select(
        `
          event_id,
          skill_id,
          skills (id, name, description, color)
        `
      )
      .eq("org_id", org.id),
    supabase
      .from("event_participations")
      .select(
        `
          event_id,
          member_id,
          status
        `
      )
      .eq("org_id", org.id),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "tasks.create",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "tasks.edit",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "tasks.delete",
    }),
  ])

  const allMembers = (orgMembersResult ?? []).map((member) => ({
    id: member.id,
    user_id: member.user_id,
    users: {
      id: member.user_id,
      email: member.user.email ?? null,
      user_metadata: member.user.user_metadata ?? null,
    },
  })) as EventOrgMember[]

  const membersById = new Map(allMembers.map((member) => [member.id, member]))

  const tasks = (tasksResult.data ?? []).map((task: TaskRow) => {
    const eventRecord = normalizeSingle(task.events)
    const orgMember = task.assignee_member_id
      ? membersById.get(task.assignee_member_id) ?? null
      : null

    const skillLinks = (task.task_skill_links ?? [])
      .map((link) => {
        const skill = normalizeSingle(link.skills)
        if (!skill) return null
        return {
          skill_id: link.skill_id,
          skills: skill,
        }
      })
      .filter(Boolean) as Array<{ skill_id: string; skills: EventSkill }>

    return {
      ...task,
      events: eventRecord,
      org_members: orgMember,
      task_skill_links: skillLinks,
    }
  }) as TaskWithEvent[]

  const allSkills = skillsResult.data ?? []
  const events = (eventsResult.data ?? []) as EventSummary[]

  const participations = (participationsResult.data ?? []).map((row: ParticipationRow) => {
    const orgMember = membersById.get(row.member_id) ?? null

    return {
      event_id: row.event_id,
      participation: {
        member_id: row.member_id,
        status: row.status,
        org_members: orgMember,
      } as EventParticipation,
    }
  })

  const participationsByEvent = participations.reduce<Record<string, EventParticipation[]>>(
    (acc, row) => {
      acc[row.event_id] = acc[row.event_id] ?? []
      acc[row.event_id].push(row.participation)
      return acc
    },
    {}
  )

  const eventSkillsByEvent = (eventSkillsResult.data ?? []).reduce<
    Record<string, EventSkill[]>
  >((acc, row: EventSkillRow) => {
    const skill = normalizeSingle(row.skills)
    if (!skill) return acc
    acc[row.event_id] = acc[row.event_id] ?? []
    acc[row.event_id].push(skill)
    return acc
  }, {})

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Tasks" />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <AllTasksWrapper
          orgId={org.id}
          orgSlug={orgSlug}
          tasks={tasks}
          events={events}
          allMembers={allMembers}
          allSkills={allSkills}
          eventSkillsByEvent={eventSkillsByEvent}
          participationsByEvent={participationsByEvent}
          canCreateTasks={canCreateTasksResult.data === true}
          canEditTasks={canEditTasksResult.data === true}
          canDeleteTasks={canDeleteTasksResult.data === true}
        />
      </div>
    </div>
  )
}
