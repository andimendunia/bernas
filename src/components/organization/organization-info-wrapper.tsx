"use client"

import { useRouter } from "next/navigation"
import { OrganizationInfo } from "./organization-info"
import { Member } from "@/lib/permissions"

type MemberSkill = {
  member_id: string
  tag_id: string
  tag: {
    id: string
    name: string
    color: string | null
  }
}

type OrganizationInfoWrapperProps = {
  organization: {
    id: string
    name: string
    join_code: string
    avatar_emoji: string
    avatar_color: string
    created_at: string
  }
  canEdit: boolean
  members: Member[]
  memberSkills: MemberSkill[]
  canChangeRole: boolean
  canRemove: boolean
}

export function OrganizationInfoWrapper(props: OrganizationInfoWrapperProps) {
  const router = useRouter()

  const handleMemberUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  const handleOrganizationUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return (
    <OrganizationInfo
      {...props}
      onMemberUpdated={handleMemberUpdated}
      onOrganizationUpdated={handleOrganizationUpdated}
    />
  )
}
