"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrganizationInfo } from "@/components/organization/organization-info"
import { Skills } from "@/components/skills/skills"
import { Tags } from "@/components/tags/tags"
import { Member } from "@/lib/permissions"

type Skill = {
  id: string
  name: string
  description: string | null
  color: string | null
}

type MemberSkill = {
  member_id: string
  skill_id: string
  skill: Skill
}

type SkillMember = {
  id: string
  member_id: string
  skill_id: string
  skills: Skill
  org_members: {
    id: string
    user_id: string
    is_admin: boolean
  }
}

type Tag = {
  id: string
  name: string
  color: string | null
  created_at: string
}

type TagLink = {
  tag_id: string
  event_id?: string
  resource_id?: string
}

type OrganizationProfilePermissions = {
  canEditOrg: boolean
  canChangeRole: boolean
  canRemove: boolean
  canAssignSelf: boolean
  canAssignOthers: boolean
  canRemoveSelf: boolean
  canRemoveOthers: boolean
}

export type OrganizationProfileProps = {
  org: {
    id: string
    name: string
    join_code: string
    avatar_emoji: string
    avatar_color: string
    created_at: string
  }
  members: Member[]
  memberSkills: MemberSkill[]
  skills: Skill[]
  skillMembers: SkillMember[]
  tags: Tag[]
  eventTagLinks: TagLink[]
  resourceTagLinks: TagLink[]
  permissions: OrganizationProfilePermissions
  currentMemberId?: string
  orgSlug: string
  defaultTab?: string
  onUpdated: () => void
}

export function OrganizationProfile({
  org,
  members,
  memberSkills,
  skills,
  skillMembers,
  tags,
  eventTagLinks,
  resourceTagLinks,
  permissions,
  currentMemberId,
  orgSlug,
  defaultTab = "members",
  onUpdated,
}: OrganizationProfileProps) {
  const resolvedTab =
    defaultTab === "skills" || defaultTab === "tags" ? defaultTab : "members"

  return (
    <Tabs defaultValue={resolvedTab} className="w-full" data-org-slug={orgSlug}>
      <TabsList>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="mt-6">
        <OrganizationInfo
          organization={org}
          canEdit={permissions.canEditOrg}
          members={members}
          memberSkills={memberSkills}
          canChangeRole={permissions.canChangeRole}
          canRemove={permissions.canRemove}
          onMemberUpdated={onUpdated}
          onOrganizationUpdated={onUpdated}
        />
      </TabsContent>

      <TabsContent value="skills" className="mt-6">
        <Skills
          organizationId={org.id}
          skills={skills}
          memberSkills={skillMembers}
          members={members}
          currentMemberId={currentMemberId}
          canAssignSelf={permissions.canAssignSelf}
          canAssignOthers={permissions.canAssignOthers}
          canRemoveSelf={permissions.canRemoveSelf}
          canRemoveOthers={permissions.canRemoveOthers}
          onSkillsUpdated={onUpdated}
        />
      </TabsContent>

      <TabsContent value="tags" className="mt-6">
        <Tags
          organizationId={org.id}
          tags={tags}
          eventTagLinks={eventTagLinks}
          resourceTagLinks={resourceTagLinks}
          onTagsUpdated={onUpdated}
        />
      </TabsContent>
    </Tabs>
  )
}
