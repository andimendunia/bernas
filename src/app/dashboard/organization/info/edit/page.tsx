import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { OrganizationEdit } from "@/components/organization/organization-edit"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Edit Organization",
}

export default async function OrganizationEditPage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    redirect("/auth/sign-in")
  }

  const metadata = (user.user_metadata ?? {}) as { active_org_id?: string }

  const { data: orgRows } = await supabase
    .from("org_members")
    .select("org_id, organizations ( id, name, avatar_emoji, avatar_color )")
    .eq("user_id", user.id)

  const organizations =
    orgRows
      ?.map((row: any) => row.organizations)
      .filter(Boolean) ?? []

  const activeOrg =
    organizations.find((org: any) => org.id === metadata.active_org_id) ??
    organizations[0]

  if (!activeOrg) {
    redirect("/onboarding")
  }

  // Check permission
  const { data: canEditData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrg.id,
    permission_name: 'org.edit_settings'
  })
  
  if (canEditData !== true) {
    redirect("/dashboard/organization/info")
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Edit"
        sectionHref="/dashboard/organization/info"
        sectionLabel={activeOrg.name}
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <OrganizationEdit
          organization={{
            id: activeOrg.id,
            name: activeOrg.name,
            avatar_emoji: activeOrg.avatar_emoji ?? "🤝",
            avatar_color: activeOrg.avatar_color ?? "#f2b5b5",
          }}
        />
      </div>
    </div>
  )
}
