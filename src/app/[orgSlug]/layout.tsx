import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect("/auth/sign-in")
  }

  // Check app_metadata for onboarding status (not user_metadata)
  const appMetadata = userData.user.app_metadata as { onboarded?: boolean }
  if (!appMetadata?.onboarded) {
    redirect("/onboarding")
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, tier, avatar_emoji, avatar_color")
    .eq("slug", orgSlug)
    .single()

  if (!org) {
    redirect("/onboarding?error=org-not-found")
  }

  const { data: member } = await supabase
    .from("org_members")
    .select("id")
    .eq("org_id", org.id)
    .eq("user_id", userData.user.id)
    .single()

  if (!member) {
    redirect("/onboarding?error=not-a-member")
  }

  // Check app_metadata for active org (not user_metadata)
  const currentActiveId = (userData.user.app_metadata as { active_org_id?: string })?.active_org_id
  if (currentActiveId !== org.id) {
    // Update active org via RPC (updates app_metadata, not user_metadata)
    await supabase.rpc("update_user_active_org", {
      target_org_id: org.id,
      target_org_slug: orgSlug,
    })
  }

  const metadata = (userData.user.user_metadata ?? {}) as {
    full_name?: string
    name?: string
    avatar_url?: string
    picture?: string
    active_org_id?: string
  }

  const { data: orgRows } = await supabase
    .from("org_members")
    .select(
      "org_id, organizations ( id, name, slug, tier, avatar_emoji, avatar_color )"
    )
    .eq("user_id", userData.user.id)

  const organizations =
    orgRows
      ?.map((row: any) => row.organizations)
      .filter(Boolean)
      .map((organization: any) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.tier === "pro" ? "Pro" : "Free",
        avatar_emoji: organization.avatar_emoji ?? "🤝",
        avatar_color: organization.avatar_color ?? "#f2b5b5",
      })) ?? []

  if (organizations.length === 0) {
    redirect("/onboarding")
  }

  const { data: isAdminData } = await supabase.rpc("is_org_admin", {
    check_org_id: org.id,
  })

  const resolvedName =
    metadata.full_name ||
    metadata.name ||
    userData.user.email?.split("@")[0] ||
    "LSM Member"

  const sidebarUser = {
    name: resolvedName,
    email: userData.user.email ?? "member@lsm.id",
    avatar: metadata.avatar_url || metadata.picture || null,
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={sidebarUser}
        organizations={organizations}
        activeOrgSlug={orgSlug}
        activeOrgId={org.id}
        isAdmin={isAdminData === true}
      />
      <SidebarInset>
        <TooltipProvider>{children}</TooltipProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}): Promise<Metadata> {
  const { orgSlug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("slug", orgSlug)
    .single()

  return {
    title: {
      default: org?.name || "Organization",
      template: `%s - ${org?.name || "Organization"}`,
    },
  }
}
