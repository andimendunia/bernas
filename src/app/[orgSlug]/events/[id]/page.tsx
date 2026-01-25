import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EventDetailWrapper } from "@/components/events/event-detail-wrapper"
import type {
  EventDetailData,
  EventMetadata,
  EventResource,
  EventSkill,
  EventTask,
  EventTag,
  EventTagLink,
  EventOrgMember,
} from "@/components/events/event-detail"
import { getOrgMembers } from "@/lib/permissions-server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Event Details",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

type EventPageProps = {
  params: Promise<{
    id: string
    orgSlug: string
  }>
}

type EventTagLinkRow = {
  tag_id: string
  event_tags: EventTag | EventTag[] | null
}

type ResourceLinkRow = {
  resource_id: string
  resources: EventResource | EventResource[] | null
}

type SkillLinkRow = {
  skill_id: string
  skills: EventSkill | EventSkill[] | null
}

type RawSkillLink = {
  skill_id: string
  skills: EventSkill | EventSkill[] | null
}

type TaskRow = Omit<EventTask, "org_members" | "task_skill_links"> & {
  task_skill_links?: RawSkillLink[]
}

type ParticipationRow = {
  member_id: string
  status: "full" | "partial" | "declined" | null
}

function normalizeSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function EventDetailPage({ params }: EventPageProps) {
  // Next.js 15: params is now a Promise
  const { id, orgSlug } = await params

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

  const activeOrgId = org.id

  const { data: eventRaw, error: eventError } = await supabase
    .from("events")
    .select(
      `
        id,
        name,
        description,
        metadata,
        created_at,
        created_by,
        event_tag_links (
          tag_id,
          event_tags (id, name, color)
        )
      `
    )
    .eq("id", id)
    .eq("org_id", activeOrgId)
    .single()

  if (eventError || !eventRaw) {
    redirect(`/${orgSlug}/events`)
  }

  const [
    resourceLinksResult,
    skillLinksResult,
    tasksResult,
    participationsResult,
    allSkillsResult,
    orgMembersResult,
    canEditResult,
    canCreateTasksResult,
    canEditTasksResult,
    canDeleteTasksResult,
  ] = await Promise.all([
    supabase
      .from("resource_links")
      .select(
        `
          resource_id,
          resources (id, title, url, description)
        `
      )
      .eq("linked_type", "event")
      .eq("linked_id", id)
      .eq("org_id", activeOrgId),
    supabase
      .from("event_skill_links")
      .select(
        `
          skill_id,
          skills (id, name, description, color)
        `
      )
      .eq("event_id", id)
      .eq("org_id", activeOrgId),
    supabase
      .from("tasks")
      .select(
        `
          id,
          title,
          description,
          status,
          deadline,
          assignee_member_id,
          created_at,
          updated_at,
          org_members (
            id,
            user_id
          ),
          task_skill_links (
            skill_id,
            skills (id, name, description, color)
          )
        `
      )
      .eq("event_id", id)
      .eq("org_id", activeOrgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_participations")
      .select(
        `
          member_id,
          status
        `
      )
      .eq("event_id", id)
      .eq("org_id", activeOrgId),
    supabase
      .from("skills")
      .select("id, name, description, color")
      .eq("org_id", activeOrgId)
      .order("name"),
    getOrgMembers(activeOrgId),
    supabase.rpc("has_permission", {
      check_org_id: activeOrgId,
      permission_name: "events.edit",
    }),
    supabase.rpc("has_permission", {
      check_org_id: activeOrgId,
      permission_name: "tasks.create",
    }),
    supabase.rpc("has_permission", {
      check_org_id: activeOrgId,
      permission_name: "tasks.edit",
    }),
    supabase.rpc("has_permission", {
      check_org_id: activeOrgId,
      permission_name: "tasks.delete",
    }),
  ])

  const eventTagLinks = (eventRaw.event_tag_links ?? [])
    .map((link: EventTagLinkRow) => {
      const tag = normalizeSingle(link.event_tags)
      if (!tag) return null
      return {
        tag_id: link.tag_id,
        event_tags: tag,
      }
    })
    .filter(Boolean) as EventTagLink[]

  const event: EventDetailData = {
    id: eventRaw.id,
    name: eventRaw.name,
    description: eventRaw.description,
    metadata: (eventRaw.metadata ?? {}) as EventMetadata,
    created_at: eventRaw.created_at,
    created_by: eventRaw.created_by,
    event_tag_links: eventTagLinks,
  }

  const resources = (resourceLinksResult.data ?? [])
    .map((link: ResourceLinkRow) => normalizeSingle(link.resources))
    .filter(Boolean) as EventResource[]

  const skills = (skillLinksResult.data ?? [])
    .map((link: SkillLinkRow) => normalizeSingle(link.skills))
    .filter(Boolean) as EventSkill[]

  // Fetch member skills for skill matching in task assignment
  const { data: memberSkillsResult } = await supabase
    .from("member_skills")
    .select("member_id, skill_id, skills (id, name)")
    .eq("org_id", activeOrgId)

  const memberSkillsMap = new Map<string, Array<{ skill_id: string; skills: { id: string; name: string } }>>()
  memberSkillsResult?.forEach((ms: any) => {
    if (!memberSkillsMap.has(ms.member_id)) {
      memberSkillsMap.set(ms.member_id, [])
    }
    memberSkillsMap.get(ms.member_id)!.push({
      skill_id: ms.skill_id,
      skills: ms.skills
    })
  })

  const allMembers = (orgMembersResult ?? []).map((member) => ({
    id: member.id,
    user_id: member.user_id,
    users: {
      id: member.user_id,
      email: member.user.email ?? null,
      user_metadata: member.user.user_metadata ?? null,
    },
    member_skills: memberSkillsMap.get(member.id) ?? [],
  })) as EventOrgMember[]

  const membersById = new Map(allMembers.map((member) => [member.id, member]))

  const tasks = (tasksResult.data ?? []).map((task: TaskRow) => {
    const orgMember = task.assignee_member_id
      ? membersById.get(task.assignee_member_id) ?? null
      : null

    const skillLinks = (task.task_skill_links ?? [])
      .map((link: RawSkillLink) => {
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
      org_members: orgMember,
      task_skill_links: skillLinks,
    }
  }) as EventTask[]

  const participations = (participationsResult.data ?? []).map(
    (p: ParticipationRow) => {
      const orgMember = membersById.get(p.member_id) ?? null

      return {
        member_id: p.member_id,
        status: p.status,
        org_members: orgMember,
      }
    }
  )

  const allSkills = allSkillsResult.data ?? []

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Event details"
        sectionHref={`/${orgSlug}/events`}
        sectionLabel="Events"
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <EventDetailWrapper
          event={event}
          resources={resources}
          skills={skills}
          tasks={tasks}
          participations={participations}
          allMembers={allMembers}
          eventSkills={skills}
          allSkills={allSkills}
          eventId={id}
          orgId={activeOrgId}
          canEdit={canEditResult.data === true}
          canCreateTasks={canCreateTasksResult.data === true}
          canEditTasks={canEditTasksResult.data === true}
          canDeleteTasks={canDeleteTasksResult.data === true}
          orgSlug={orgSlug}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
