"use client"

import { useRouter } from "next/navigation"
import { Skills } from "./skills"
import { Member } from "@/lib/permissions"

type Tag = {
  id: string
  name: string
  color: string | null
}

type MemberSkill = {
  id: string
  member_id: string
  tag_id: string
  event_tags: Tag
  org_members: {
    id: string
    user_id: string
    is_admin: boolean
  }
}

type SkillsWrapperProps = {
  organizationId: string
  tags: Tag[]
  memberSkills: MemberSkill[]
  members: Member[]
  currentMemberId?: string
  canAssignSelf: boolean
  canAssignOthers: boolean
  canRemoveSelf: boolean
  canRemoveOthers: boolean
}

export function SkillsWrapper(props: SkillsWrapperProps) {
  const router = useRouter()

  const handleSkillsUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return <Skills {...props} onSkillsUpdated={handleSkillsUpdated} />
}
