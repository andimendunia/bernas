"use client"

"use client"

import * as React from "react"
import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TagBadge } from "@/components/ui/tag-badge"
import { SkillBadge } from "@/components/ui/skill-badge"
import { EventTasksSection } from "@/components/tasks/event-tasks-section"
import { EventParticipationPanel } from "@/components/events/event-participation-panel"
import { AvatarGroup } from "@/components/ui/avatar-group"
import { getMemberName } from "@/components/tasks/task-utils"
import { ManageEventResourcesDialog } from "@/components/events/manage-event-resources-dialog"

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
  title: string
  description: string | null
  status: "todo" | "in_progress" | "done"
  deadline: string | null
  assignee_member_id: string | null
  created_at: string
  updated_at: string
  org_members: EventOrgMember | null
  task_skill_links?: Array<{
    skill_id: string
    skills: EventSkill
  }>
}

export type EventParticipation = {
  member_id: string
  status: "full" | "partial" | "declined" | null
  org_members: EventOrgMember | null
}

export type EventDetailProps = {
  event: EventDetailData
  resources: EventResource[]
  skills: EventSkill[]
  tasks: EventTask[]
  participations: EventParticipation[]
  allMembers: EventOrgMember[]
  eventSkills: EventSkill[]
  allSkills: EventSkill[]
  eventId: string
  orgId: string
  canEdit: boolean
  canCreateTasks: boolean
  canEditTasks: boolean
  canDeleteTasks: boolean
  orgSlug: string
  onEventUpdated: () => void
  currentUserId: string | null
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

export function EventDetail({
  event,
  resources,
  skills,
  tasks,
  participations,
  allMembers,
  eventSkills,
  allSkills,
  eventId,
  orgId,
  canEdit,
  canCreateTasks,
  canEditTasks,
  canDeleteTasks,
  orgSlug,
  onEventUpdated,
  currentUserId,
}: EventDetailProps) {
  const startDate = event.metadata?.start_date
  const endDate = event.metadata?.end_date
  const [resourcesDialogOpen, setResourcesDialogOpen] = React.useState(false)
  const dateRange = startDate
    ? `${formatIndonesianDate(startDate)}${
        endDate && endDate !== startDate ? ` - ${formatIndonesianDate(endDate)}` : ""
      }`
    : null

  const tags = event.event_tag_links.map((link) => link.event_tags)

  const getAvatarUrl = (member: EventOrgMember | null) => {
    const metadata = member?.users?.user_metadata as Record<string, unknown> | null
    const avatarUrl = metadata?.avatar_url
    const picture = metadata?.picture
    if (typeof avatarUrl === "string" && avatarUrl.length > 0) return avatarUrl
    if (typeof picture === "string" && picture.length > 0) return picture
    return null
  }

  const participationGroups = {
    full: [] as Array<{ id: string; name: string; imageUrl?: string | null }>,
    partial: [] as Array<{ id: string; name: string; imageUrl?: string | null }>,
    declined: [] as Array<{ id: string; name: string; imageUrl?: string | null }>,
  }

  participations.forEach((participation) => {
    const status = participation.status
    if (!status) return
    const name = getMemberName(participation.org_members)
    const imageUrl = getAvatarUrl(participation.org_members)
    participationGroups[status].push({
      id: participation.member_id,
      name,
      imageUrl,
    })
  })

  const summaryItems = [
    { status: "full" as const, label: "Participating", items: participationGroups.full },
    { status: "partial" as const, label: "Partial participation", items: participationGroups.partial },
    { status: "declined" as const, label: "Not participating", items: participationGroups.declined },
  ].filter((item) => item.items.length > 0)

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
              {dateRange && (
                <p className="text-sm text-muted-foreground">{dateRange}</p>
              )}
            </div>

            {(tags.length > 0 || skills.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <TagBadge key={tag.id} tagColor={tag.color}>
                    {tag.name}
                  </TagBadge>
                ))}
                {skills.map((skill) => (
                  <SkillBadge key={skill.id}>{skill.name}</SkillBadge>
                ))}
              </div>
            )}
          </div>

          {event.description && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {(resources.length > 0 || canEdit) && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Resources</h2>
              {resources.length > 0 ? (
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  No resources yet. Add resources to help members prepare.
                </p>
              )}
              {canEdit && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="px-0"
                  onClick={() => setResourcesDialogOpen(true)}
                >
                  Edit resources
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <div className="text-sm font-medium">Participation</div>
              <p className="text-xs text-muted-foreground">
                Set your status and see who is participating.
              </p>
            </div>
            <EventParticipationPanel
              orgId={orgId}
              eventId={eventId}
              participations={participations}
              allMembers={allMembers}
              onUpdated={onEventUpdated}
              showHeader={false}
            />
            {summaryItems.length > 0 && (
              <div className="grid gap-3">
                {summaryItems.map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </div>
                    <AvatarGroup items={item.items} max={5} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <EventTasksSection
        eventId={eventId}
        orgId={orgId}
        orgSlug={orgSlug}
        tasks={tasks}
        participations={participations}
        allMembers={allMembers}
        eventSkills={eventSkills}
        allSkills={allSkills}
        canCreateTasks={canCreateTasks}
        canEditTasks={canEditTasks}
        canDeleteTasks={canDeleteTasks}
        onTasksUpdated={onEventUpdated}
        currentUserId={currentUserId}
      />

      <ManageEventResourcesDialog
        open={resourcesDialogOpen}
        onOpenChange={setResourcesDialogOpen}
        organizationId={orgId}
        eventId={eventId}
        eventName={event.name}
        attachedResourceIds={resources.map((resource) => resource.id)}
        onSuccess={onEventUpdated}
      />
    </div>
  )
}
