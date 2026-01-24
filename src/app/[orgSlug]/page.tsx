import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { OrganizationProfileWrapper } from "@/components/organization/organization-profile-wrapper"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getOrgMembers } from "@/lib/permissions-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OrganizationProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams?: Promise<{ tab?: string }>
}) {
  const { orgSlug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    redirect("/auth/sign-in")
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, join_code, avatar_emoji, avatar_color, created_at")
    .eq("slug", orgSlug)
    .single()

  if (!org) {
    redirect("/onboarding")
  }

  const defaultTab =
    resolvedSearchParams.tab === "skills" ||
    resolvedSearchParams.tab === "tags" ||
    resolvedSearchParams.tab === "members"
      ? resolvedSearchParams.tab
      : "members"

  const [
    members,
    memberSkillsResult,
    skillsResult,
    tagsResult,
    eventTagLinksResult,
    resourceTagLinksResult,
    canEditResult,
    canChangeRoleResult,
    canRemoveResult,
    canAssignSelfResult,
    canAssignOthersResult,
    canRemoveSelfResult,
    canRemoveOthersResult,
  ] = await Promise.all([
    getOrgMembers(org.id),
    supabase
      .from("member_skills")
      .select(
        `
        id,
        member_id,
        skill_id,
        skills (
          id,
          name,
          description,
          color
        ),
        org_members (
          id,
          user_id,
          is_admin
        )
      `
      )
      .eq("org_id", org.id),
    supabase
      .from("skills")
      .select("id, name, description, color")
      .eq("org_id", org.id)
      .order("name"),
    supabase
      .from("event_tags")
      .select("id, name, color, created_at")
      .eq("org_id", org.id)
      .order("name"),
    supabase
      .from("event_tag_links")
      .select("tag_id, event_id")
      .eq("org_id", org.id),
    supabase
      .from("resource_tag_links")
      .select("tag_id, resource_id")
      .eq("org_id", org.id),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "org.edit_settings",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "members.change_role",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "members.remove",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "skills.assign_self",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "skills.assign_others",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "skills.remove_self",
    }),
    supabase.rpc("has_permission", {
      check_org_id: org.id,
      permission_name: "skills.remove_others",
    }),
  ])

  const memberSkillsRaw = memberSkillsResult.data ?? []
  const memberSkills = memberSkillsRaw
    .filter((ms: any) => ms.skills?.id && ms.skills?.name)
    .map((ms: any) => ({
      member_id: ms.member_id,
      skill_id: ms.skill_id,
      skill: ms.skills,
    }))

  const skillMembers = memberSkillsRaw.map((ms: any) => ({
    ...ms,
    skills: ms.skills ?? { id: "", name: "", description: null, color: null },
    org_members: ms.org_members ?? { id: "", user_id: "", is_admin: false },
  }))

  const currentMemberId = members.find((member) => member.user_id === user.id)?.id

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Info"
        sectionHref={`/${orgSlug}`}
        sectionLabel={org.name}
      />
      <div className="flex flex-1 items-start justify-center p-4 pt-0">
        <OrganizationProfileWrapper
          org={{
            id: org.id,
            name: org.name,
            join_code: org.join_code,
            avatar_emoji: org.avatar_emoji ?? "🤝",
            avatar_color: org.avatar_color ?? "#f2b5b5",
            created_at: org.created_at,
          }}
          members={members}
          memberSkills={memberSkills}
          skills={skillsResult.data ?? []}
          skillMembers={skillMembers}
          tags={tagsResult.data ?? []}
          eventTagLinks={eventTagLinksResult.data ?? []}
          resourceTagLinks={resourceTagLinksResult.data ?? []}
          permissions={{
            canEditOrg: canEditResult.data === true,
            canChangeRole: canChangeRoleResult.data === true,
            canRemove: canRemoveResult.data === true,
            canAssignSelf: canAssignSelfResult.data === true,
            canAssignOthers: canAssignOthersResult.data === true,
            canRemoveSelf: canRemoveSelfResult.data === true,
            canRemoveOthers: canRemoveOthersResult.data === true,
          }}
          orgSlug={orgSlug}
          defaultTab={defaultTab}
          currentMemberId={currentMemberId}
        />
      </div>
    </div>
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
      absolute: org?.name || "Organization",
    },
  }
}
