import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { OrganizationInfoWrapper } from "@/components/organization/organization-info-wrapper"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getOrgMembers } from "@/lib/permissions-server"

export const metadata = {
  title: "Organization info",
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrganizationInfoPage() {
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

  const { data: orgRows } = await supabase
    .from("org_members")
    .select("org_id, organizations ( id, name, join_code, avatar_emoji, avatar_color, created_at )")
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

  // Get members
  const members = await getOrgMembers(activeOrgId)

  // Get member skills
  const { data: memberSkillsRaw } = await supabase
    .from("member_skills")
    .select(`
      member_id,
      skill_id,
      skills (
        id,
        name,
        description,
        color
      )
    `)
    .eq("org_id", activeOrgId)

  // Transform member skills
  const memberSkills = (memberSkillsRaw ?? []).map((ms: any) => ({
    member_id: ms.member_id,
    skill_id: ms.skill_id,
    skill: ms.skills?.[0] ?? { id: '', name: '', description: null, color: null },
  }))

  // Check permissions
  const { data: canEditData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'org.edit_settings'
  })

  const { data: canChangeRoleData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'members.change_role'
  })

  const { data: canRemoveData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'members.remove'
  })

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Organization info"
        sectionHref="/dashboard/organization/info"
        sectionLabel={activeOrg.name}
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <OrganizationInfoWrapper
          organization={{
            id: activeOrg.id,
            name: activeOrg.name,
            join_code: activeOrg.join_code,
            avatar_emoji: activeOrg.avatar_emoji ?? "🤝",
            avatar_color: activeOrg.avatar_color ?? "#f2b5b5",
            created_at: activeOrg.created_at,
          }}
          canEdit={canEditData === true}
          members={members}
          memberSkills={memberSkills}
          canChangeRole={canChangeRoleData === true}
          canRemove={canRemoveData === true}
        />
      </div>
    </div>
  )
}
