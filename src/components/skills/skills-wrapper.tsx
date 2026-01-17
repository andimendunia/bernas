"use client"

import { useRouter } from "next/navigation"
import { Skills } from "./skills"
import { Member } from "@/lib/permissions"

type Skill = {
  id: string
  name: string
  description: string | null
  color: string | null
}

type MemberSkill = {
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

type SkillsWrapperProps = {
  organizationId: string
  skills: Skill[]
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
