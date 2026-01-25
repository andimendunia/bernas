import { format, isValid, parseISO } from "date-fns"

import type { EventOrgMember, EventTask } from "@/components/events/event-detail"

export const statusConfig = {
  todo: { label: "To Do", color: "bg-gray-200 text-gray-800" },
  in_progress: { label: "In Progress", color: "bg-blue-200 text-blue-800" },
  done: { label: "Done", color: "bg-green-200 text-green-800" },
} as const

const getMetadataName = (metadata: Record<string, unknown> | null | undefined) => {
  const fullName = metadata?.full_name
  const name = metadata?.name

  if (typeof fullName === "string" && fullName.trim().length > 0) return fullName
  if (typeof name === "string" && name.trim().length > 0) return name
  return null
}

export const getMemberName = (member: EventOrgMember | null) => {
  if (!member) return "Unassigned"
  const metadata = member.users?.user_metadata as Record<string, unknown> | null
  const name = getMetadataName(metadata)
  if (name) return name
  if (member.users?.email) return member.users.email
  return "Unknown"
}

export const getMemberInitials = (member: EventOrgMember | null) => {
  const name = getMemberName(member)
  if (name === "Unassigned" || name === "Unknown") return "?"
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export const getAssigneeName = (task: EventTask) => getMemberName(task.org_members)

export const getAssigneeInitials = (task: EventTask) => getMemberInitials(task.org_members)

export const formatDeadline = (deadline: string | null) => {
  if (!deadline) return null
  const date = parseISO(deadline)
  if (!isValid(date)) return null
  return format(date, "MMM d, yyyy")
}
