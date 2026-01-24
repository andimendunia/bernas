import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ResourcesWrapper } from "@/components/resources/resources-wrapper"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Resources",
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ResourcesPage({
  params,
}: {
  params: { orgSlug: string }
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

  // Get resources with tags and event links
  const { data: resourcesRaw } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      description,
      type,
      url,
      created_at,
      created_by,
      resource_tag_links (
        tag_id,
        event_tags (
          id,
          name,
          color
        )
      ),
      resource_links (
        linked_type,
        linked_id
      )
    `)
    .eq("org_id", activeOrgId)
    .order("created_at", { ascending: false })

  // Transform the data to match expected type
  const resources = (resourcesRaw ?? []).map((resource: any) => ({
    ...resource,
    resource_tag_links: (resource.resource_tag_links ?? [])
      .filter((link: any) => link.event_tags) // Only keep links with valid tags
      .map((link: any) => ({
        tag_id: link.tag_id,
        event_tags: link.event_tags,
      })),
  }))

  // Get all tags for filters
  const { data: tags } = await supabase
    .from("event_tags")
    .select("id, name, color")
    .eq("org_id", activeOrgId)
    .order("name")

  // Check permissions
  const { data: canCreateData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'resources.create'
  })

  const { data: canEditData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'resources.edit'
  })

  const { data: canDeleteData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'resources.delete'
  })

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Resources"
        sectionHref={`/${orgSlug}/resources`}
        sectionLabel={org.name}
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <ResourcesWrapper
          organizationId={activeOrgId}
          resources={resources}
          tags={tags ?? []}
          canCreate={canCreateData === true || user.id === user.id} // Everyone can create
          canEdit={canEditData === true}
          canDelete={canDeleteData === true}
        />
      </div>
    </div>
  )
}
