import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AdministrationTabs } from "@/components/administration/administration-tabs"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getOrgRoles, getAllPermissions, getPendingJoinRequests } from "@/lib/permissions-server"

export const metadata = {
  title: "Administration",
}

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdministrationPage() {
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

  // Check if user is admin
  const { data: isAdminData } = await supabase.rpc('is_org_admin', {
    check_org_id: activeOrgId
  })

  if (isAdminData !== true) {
    redirect("/dashboard")
  }

  // Fetch data
  let permissions: any[] = []
  let roles: any[] = []
  let joinRequests: any[] = []
  let orgData: any = null
  
  try {
    const results = await Promise.all([
      getOrgRoles(activeOrgId),
      getAllPermissions(),
      getPendingJoinRequests(activeOrgId),
      supabase
        .from("organizations")
        .select("id, name")
        .eq("id", activeOrgId)
        .single(),
    ])
    
    roles = results[0]
    permissions = results[1]
    joinRequests = results[2]
    orgData = results[3]
  } catch (error) {
    // Set empty arrays as fallback
    permissions = []
    roles = []
    joinRequests = []
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Administration"
        sectionHref="/dashboard/organization"
        sectionLabel="Organization"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <AdministrationTabs
          roles={roles}
          permissions={permissions}
          joinRequests={joinRequests}
          orgId={activeOrgId}
          orgName={orgData.data?.name || ''}
        />
      </div>
    </div>
  )
}
