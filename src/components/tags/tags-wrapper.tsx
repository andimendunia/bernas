"use client"

import { useRouter } from "next/navigation"
import { Tags } from "./tags"

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

type TagsWrapperProps = {
  organizationId: string
  tags: Tag[]
  eventTagLinks: TagLink[]
  resourceTagLinks: TagLink[]
}

export function TagsWrapper(props: TagsWrapperProps) {
  const router = useRouter()

  const handleTagsUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return <Tags {...props} onTagsUpdated={handleTagsUpdated} />
}
