"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type EventTag = {
  id: string
  name: string
  color: string | null
}

export type EventTagLink = {
  tag_id: string
  event_tags: EventTag
}

export type EventMetadata = {
  start_date?: string
  end_date?: string | null
}

export type EventDetailData = {
  id: string
  name: string
  description: string | null
  metadata: EventMetadata
  created_at: string
  created_by: string
  event_tag_links: EventTagLink[]
}

export type EventResource = {
  id: string
  title: string
  url: string | null
  description: string | null
}

export type EventSkill = {
  id: string
  name: string
  description: string | null
  color: string | null
}

export type EventUser = {
  id: string
  email: string | null
  user_metadata: Record<string, unknown> | null
}

export type EventOrgMember = {
  id: string
  user_id: string
  users: EventUser | null
}

export type EventTask = {
  id: string
  name: string
  description: string | null
  status: string
  due_date: string | null
  assigned_to: string | null
  org_members: EventOrgMember | null
}

export type EventDetailProps = {
  event: EventDetailData
  resources: EventResource[]
  skills: EventSkill[]
  tasks: EventTask[]
  canEdit: boolean
  canCreateTasks: boolean
  orgSlug: string
  onEventUpdated: () => void
}

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

function formatIndonesianDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = INDONESIAN_MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

export function EventDetail({ event, resources, skills, tasks, orgSlug }: EventDetailProps) {
  const startDate = event.metadata?.start_date
  const endDate = event.metadata?.end_date
  const dateRange = startDate
    ? `${formatIndonesianDate(startDate)}${
        endDate && endDate !== startDate ? ` - ${formatIndonesianDate(endDate)}` : ""
      }`
    : null

  const tags = event.event_tag_links.map((link) => link.event_tags)

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <Button variant="ghost" asChild className="w-fit px-0">
          <Link href={`/${orgSlug}/events`} className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Back to Events
          </Link>
        </Button>

        <div className="flex flex-col gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
            {dateRange && (
              <p className="text-sm text-muted-foreground">{dateRange}</p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {event.description && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {event.description}
          </p>
        </section>
      )}

      {resources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Resources</h2>
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="space-y-1">
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <ExternalLink className="size-4" />
                    <span>{resource.title}</span>
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ExternalLink className="size-4" />
                    <span>{resource.title}</span>
                  </div>
                )}
                {resource.description && (
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.id} variant="outline">
                {skill.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <p className="text-sm text-muted-foreground">
          Task management coming soon.
        </p>
      </section>
    </div>
  )
}
