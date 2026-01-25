export type EventParticipation = {
  member_id: string
  status: "full" | "partial" | "declined" | null
  org_members: {
    id: string
    user_id: string
    users: {
      id: string
      email: string | null
      user_metadata: Record<string, unknown> | null
    } | null
  } | null
}
