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

export default async function ResourcesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    redirect("/auth/sign-in")
  }

  const metadata = (user.user_metadata ?? {}) as { active_org_id?: string }
  const activeOrgId = metadata.active_org_id

  if (!activeOrgId) {
    redirect("/onboarding")
  }

  // Get organization data
  const { data: orgRows } = await supabase
    .from("org_members")
    .select("org_id, organizations ( id, name )")
    .eq("user_id", user.id)

  const organizations =
    orgRows
      ?.map((row: any) => row.organizations)
      .filter(Boolean) ?? []

  const activeOrg =
    organizations.find((org: any) => org.id === activeOrgId) ??
    organizations[0]

  if (!activeOrg) {
    redirect("/onboarding")
  }

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
        sectionHref="/dashboard/resources"
        sectionLabel={activeOrg.name}
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
