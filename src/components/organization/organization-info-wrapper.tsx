"use client"

import { useRouter } from "next/navigation"
import { OrganizationInfo } from "./organization-info"
import { Member } from "@/lib/permissions"

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

  return <OrganizationInfo {...props} onMemberUpdated={handleMemberUpdated} />
}
