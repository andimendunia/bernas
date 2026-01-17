import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TagsWrapper } from "@/components/tags/tags-wrapper"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Tags",
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TagsPage() {
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

  // Get all tags with usage counts
  const { data: tags } = await supabase
    .from("event_tags")
    .select(`
      id,
      name,
      color,
      created_at
    `)
    .eq("org_id", activeOrgId)
    .order("name")

  // Get event tag links
  const { data: eventTagLinks } = await supabase
    .from("event_tag_links")
    .select("tag_id, event_id")
    .eq("org_id", activeOrgId)

  // Get resource tag links
  const { data: resourceTagLinks } = await supabase
    .from("resource_tag_links")
    .select("tag_id, resource_id")
    .eq("org_id", activeOrgId)

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Tags"
        sectionHref="/dashboard/organization/tags"
        sectionLabel={activeOrg.name}
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <TagsWrapper
          organizationId={activeOrgId}
          tags={tags ?? []}
          eventTagLinks={eventTagLinks ?? []}
          resourceTagLinks={resourceTagLinks ?? []}
        />
      </div>
    </div>
  )
}
