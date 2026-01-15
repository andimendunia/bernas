import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MemberListWrapper } from "@/components/members/member-list-wrapper"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getOrgMembers } from "@/lib/permissions-server"

export const metadata = {
  title: "Members",
}

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrganizationMembersPage() {
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

  // Check if user can view members
  const { data: canViewData } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'members.view'
  })

  if (canViewData !== true) {
    redirect("/dashboard")
  }

  // Get members
  const members = await getOrgMembers(activeOrgId)

  // Check permissions
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
        title="Members"
        sectionHref="/dashboard/organization"
        sectionLabel="Organization"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <MemberListWrapper
          members={members}
          canChangeRole={canChangeRoleData === true}
          canRemove={canRemoveData === true}
        />
      </div>
    </div>
  )
}
