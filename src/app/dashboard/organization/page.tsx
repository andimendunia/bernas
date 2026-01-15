import { redirect } from "next/navigation"

import { OrganizationProfileForm } from "@/components/organization/organization-profile-form"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Organization",
}

export default async function OrganizationProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    redirect("/auth/sign-in")
  }

  const metadata = (user.user_metadata ?? {}) as { active_org_id?: string }

  const { data: orgRows } = await supabase
    .from("org_members")
    .select("org_id, organizations ( id, name, join_code, avatar_emoji, avatar_color )")
    .eq("user_id", user.id)

  const organizations =
    orgRows
      ?.map((row) => row.organizations)
      .filter(Boolean) ?? []

  const activeOrg =
    organizations.find((org) => org.id === metadata.active_org_id) ??
    organizations[0]

  if (!activeOrg) {
    redirect("/onboarding")
  }

  return (
    <div className="flex flex-1 items-start justify-center p-6">
      <OrganizationProfileForm
        organization={{
          id: activeOrg.id,
          name: activeOrg.name,
          join_code: activeOrg.join_code,
          avatar_emoji: activeOrg.avatar_emoji ?? "🤝",
          avatar_color: activeOrg.avatar_color ?? "#f2b5b5",
        }}
      />
    </div>
  )
}
