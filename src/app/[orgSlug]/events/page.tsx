import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EventsWrapper } from "@/components/events/events-wrapper"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Events",
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EventsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
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

  const activeOrgId = org.id

  // Get events with tags, resources, and skills
  const { data: eventsRaw } = await supabase
    .from("events")
    .select(`
      id,
      name,
      description,
      metadata,
      created_at,
      created_by,
      event_tag_links (
        tag_id,
        event_tags (
          id,
          name,
          color
        )
      )
    `)
    .eq("org_id", activeOrgId)
    .order("created_at", { ascending: false })

  // Get resource links for events
  const { data: resourceLinksRaw } = await supabase
    .from("resource_links")
    .select("linked_id, resource_id")
    .eq("org_id", activeOrgId)
    .eq("linked_type", "event")

  // Get event skill links
  const { data: eventSkillLinksRaw } = await supabase
    .from("event_skill_links")
    .select("event_id, skill_id")
    .eq("org_id", activeOrgId)

  // Transform the data to match expected type
  const events = (eventsRaw ?? []).map((event: any) => ({
    ...event,
    event_tag_links: (event.event_tag_links ?? [])
      .filter((link: any) => link.event_tags) // Only keep links with valid tags
      .map((link: any) => ({
        tag_id: link.tag_id,
        event_tags: link.event_tags,
      })),
    resource_link_ids: (resourceLinksRaw ?? [])
      .filter((link: any) => link.linked_id === event.id)
      .map((link: any) => link.resource_id),
    skill_ids: (eventSkillLinksRaw ?? [])
      .filter((link: any) => link.event_id === event.id)
      .map((link: any) => link.skill_id),
  }))

  // Get all tags for filters
  const { data: tags } = await supabase
    .from("event_tags")
    .select("id, name, color")
    .eq("org_id", activeOrgId)
    .order("name")

  const skillIds = Array.from(
    new Set((eventSkillLinksRaw ?? []).map((link: any) => link.skill_id))
  )

  const { data: skills } = skillIds.length
    ? await supabase
        .from("skills")
        .select("id, name")
        .eq("org_id", activeOrgId)
        .in("id", skillIds)
        .order("name")
    : { data: [] }

  // Check permissions
  const { data: canCreateData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'events.create'
  })

  const { data: canEditData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'events.edit'
  })

  const { data: canDeleteData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'events.delete'
  })

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Events"
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <EventsWrapper
          organizationId={activeOrgId}
          orgSlug={orgSlug}
          events={events}
          tags={tags ?? []}
          skills={skills ?? []}
          canCreate={canCreateData === true}
          canEdit={canEditData === true}
          canDelete={canDeleteData === true}
        />
      </div>
    </div>
  )
}
