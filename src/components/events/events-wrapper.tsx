"use client"

import { useRouter } from "next/navigation"
import { Events } from "./events"

type Tag = {
  id: string
  name: string
  color: string | null
}

type EventTagLink = {
  tag_id: string
  event_tags: Tag
}

type Event = {
  id: string
  name: string
  description: string | null
  metadata: {
    start_date?: string
    end_date?: string | null
  }
  created_at: string
  created_by: string
  event_tag_links: EventTagLink[]
}

type EventsWrapperProps = {
  organizationId: string
  events: Event[]
  tags: Tag[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export function EventsWrapper(props: EventsWrapperProps) {
  const router = useRouter()

  const handleEventsUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return <Events {...props} onEventsUpdated={handleEventsUpdated} />
}
