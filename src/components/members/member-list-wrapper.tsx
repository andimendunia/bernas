"use client"

import { useRouter } from "next/navigation"
import { MemberList } from "./member-list"
import { Member } from "@/lib/permissions"

type MemberListWrapperProps = {
  members: Member[]
  canChangeRole: boolean
  canRemove: boolean
}

export function MemberListWrapper({
  members,
  canChangeRole,
  canRemove,
}: MemberListWrapperProps) {
  const router = useRouter()

  const handleMemberUpdated = () => {
    // Force a hard refresh to ensure data is reloaded
    router.refresh()
    // Also reload after a short delay to ensure the update has propagated
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return (
    <MemberList
      members={members}
      canChangeRole={canChangeRole}
      canRemove={canRemove}
      onMemberUpdated={handleMemberUpdated}
    />
  )
}
