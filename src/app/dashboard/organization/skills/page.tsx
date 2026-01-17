import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SkillsWrapper } from "@/components/skills/skills-wrapper"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getOrgMembers } from "@/lib/permissions-server"

export const metadata = {
  title: "Skills",
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SkillsPage() {
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

  // Get all tags (used as skills)
  const { data: tags } = await supabase
    .from("event_tags")
    .select("id, name, color")
    .eq("org_id", activeOrgId)
    .order("name")

  // Get member skills with member data
  const { data: memberSkillsRaw } = await supabase
    .from("member_skills")
    .select(`
      id,
      member_id,
      tag_id,
      event_tags (
        id,
        name,
        color
      ),
      org_members (
        id,
        user_id,
        is_admin
      )
    `)
    .eq("org_id", activeOrgId)

  // Transform the data to match expected type
  const memberSkills = (memberSkillsRaw ?? []).map((ms: any) => ({
    ...ms,
    event_tags: ms.event_tags?.[0] ?? { id: '', name: '', color: null },
    org_members: ms.org_members?.[0] ?? { id: '', user_id: '', is_admin: false },
  }))

  // Get all members
  const members = await getOrgMembers(activeOrgId)

  // Get current user's member record
  const currentMember = members.find((m) => m.user_id === user.id)

  // Check permissions
  const { data: canAssignSelfData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'skills.assign_self'
  })

  const { data: canAssignOthersData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'skills.assign_others'
  })

  const { data: canRemoveSelfData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'skills.remove_self'
  })

  const { data: canRemoveOthersData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'skills.remove_others'
  })

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Skills"
        sectionHref="/dashboard/organization/skills"
        sectionLabel={activeOrg.name}
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <SkillsWrapper
          organizationId={activeOrgId}
          tags={tags ?? []}
          memberSkills={memberSkills}
          members={members}
          currentMemberId={currentMember?.id}
          canAssignSelf={canAssignSelfData === true}
          canAssignOthers={canAssignOthersData === true}
          canRemoveSelf={canRemoveSelfData === true}
          canRemoveOthers={canRemoveOthersData === true}
        />
      </div>
    </div>
  )
}
