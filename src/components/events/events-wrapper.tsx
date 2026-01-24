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

type Resource = {
  id: string
  title: string
  url: string | null
}

type Skill = {
  id: string
  name: string
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
  resource_link_ids: string[]
  skill_ids: string[]
}

type EventsWrapperProps = {
  organizationId: string
  orgSlug: string
  events: Event[]
  tags: Tag[]
  resources: Resource[]
  skills: Skill[]
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
