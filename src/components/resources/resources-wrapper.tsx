"use client"

import { useRouter } from "next/navigation"
import { Resources } from "./resources"

type Tag = {
  id: string
  name: string
  color: string | null
}

type ResourceTagLink = {
  tag_id: string
  event_tags: Tag
}

type ResourceLink = {
  linked_type: string
  linked_id: string
}

type Resource = {
  id: string
  title: string
  description: string | null
  type: string
  url: string | null
  created_at: string
  created_by: string
  resource_tag_links: ResourceTagLink[]
  resource_links: ResourceLink[]
}

type ResourcesWrapperProps = {
  organizationId: string
  resources: Resource[]
  tags: Tag[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export function ResourcesWrapper(props: ResourcesWrapperProps) {
  const router = useRouter()

  const handleResourceUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return <Resources {...props} onResourceUpdated={handleResourceUpdated} />
}
