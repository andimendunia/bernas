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
  EventUser,
} from "@/components/events/event-detail"
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

type RawOrgMember = Omit<EventOrgMember, "users"> & {
  users: EventUser | EventUser[] | null
}

type TaskRow = Omit<EventTask, "org_members"> & {
  org_members: RawOrgMember | RawOrgMember[] | null
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
    canEditResult,
    canCreateTasksResult,
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
          name,
          description,
          status,
          due_date,
          assigned_to,
          org_members (
            id,
            user_id,
            users (id, email, user_metadata)
          )
        `
      )
      .eq("event_id", id)
      .eq("org_id", activeOrgId)
      .order("created_at", { ascending: false }),
    supabase.rpc("has_permission", {
      check_org_id: activeOrgId,
      permission_name: "events.edit",
    }),
    supabase.rpc("has_permission", {
      check_org_id: activeOrgId,
      permission_name: "tasks.create",
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

  const tasks = (tasksResult.data ?? []).map((task: TaskRow) => {
    const orgMember = normalizeSingle(task.org_members)
    const userRecord = normalizeSingle<EventUser>(orgMember?.users ?? null)

    return {
      ...task,
      org_members: orgMember
        ? {
            ...orgMember,
            users: userRecord,
          }
        : null,
    }
  }) as EventTask[]

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Event details"
        sectionHref={`/${orgSlug}`}
        sectionLabel={org.name}
        subsectionHref={`/${orgSlug}/events`}
        subsectionLabel="Events"
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <EventDetailWrapper
          event={event}
          resources={resources}
          skills={skills}
          tasks={tasks}
          canEdit={canEditResult.data === true}
          canCreateTasks={canCreateTasksResult.data === true}
          orgSlug={orgSlug}
        />
      </div>
    </div>
  )
}
