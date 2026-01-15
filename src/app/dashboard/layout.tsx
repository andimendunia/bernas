import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect("/auth/sign-in")
  }

  if (!data.user.user_metadata?.onboarded) {
    redirect("/onboarding")
  }

  const metadata = (data.user.user_metadata ?? {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    picture?: string
    active_org_id?: string
  }

  const { data: orgRows } = await supabase
    .from("org_members")
    .select(
      "org_id, organizations ( id, name, tier, avatar_emoji, avatar_color )"
    )
    .eq("user_id", data.user.id)

  const organizations =
    orgRows
      ?.map((row: any) => row.organizations)
      .filter(Boolean)
      .map((org: any) => ({
        id: org.id,
        name: org.name,
        plan: org.tier === "pro" ? "Pro" : "Free",
        avatar_emoji: org.avatar_emoji ?? "🤝",
        avatar_color: org.avatar_color ?? "#f2b5b5",
      })) ?? []

  if (organizations.length === 0) {
    redirect("/onboarding")
  }

  // Check if user is admin of active org
  const activeOrg = organizations.find(org => org.id === metadata.active_org_id) ?? organizations[0]
  const { data: isAdminData } = await supabase.rpc('is_org_admin', {
    check_org_id: activeOrg.id
  })

  const resolvedName =
    metadata.full_name ||
    metadata.name ||
    data.user.email?.split("@")[0] ||
    "LSM Member"

  const sidebarUser = {
    name: resolvedName,
    email: data.user.email ?? "member@lsm.id",
    avatar: metadata.avatar_url || metadata.picture || null,
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={sidebarUser}
        organizations={organizations}
        activeOrgId={metadata.active_org_id ?? null}
        isAdmin={isAdminData === true}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    return {
      title: {
        default: "Bernas",
        template: "%s - Bernas",
      },
    }
  }

  const metadata = (user.user_metadata ?? {}) as { active_org_id?: string }
  const { data: orgRows } = await supabase
    .from("org_members")
    .select("org_id, organizations ( id, name )")
    .eq("user_id", user.id)

  const organizations =
    orgRows
      ?.map((row: any) => row.organizations)
      .filter(Boolean) ?? []

  const activeOrg =
    organizations.find((org: any) => org.id === metadata.active_org_id) ??
    organizations[0]

  const orgName = activeOrg?.name ?? "Bernas"

  return {
    title: {
      default: orgName,
      template: `%s - ${orgName}`,
    },
  }
}
