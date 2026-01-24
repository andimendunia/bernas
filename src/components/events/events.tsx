"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, X, Diamond, MoreVertical, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { AddEventDialog } from "./add-event-dialog"
import { EditEventDialog } from "./edit-event-dialog"
import { DeleteEventDialog } from "./delete-event-dialog"
import { ManageEventResourcesDialog } from "./manage-event-resources-dialog"
import { ManageEventSkillsDialog } from "./manage-event-skills-dialog"

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

type EventsProps = {
  organizationId: string
  events: Event[]
  tags: Tag[]
  resources: Resource[]
  skills: Skill[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  onEventsUpdated: () => void
}

// Indonesian month names
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function formatIndonesianDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = INDONESIAN_MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

export function Events({
  organizationId,
  events,
  tags,
  resources,
  skills,
  canCreate,
  canEdit,
  canDelete,
  onEventsUpdated,
}: EventsProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [manageResourcesDialogOpen, setManageResourcesDialogOpen] = React.useState(false)
  const [manageSkillsDialogOpen, setManageSkillsDialogOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null)

  // Filter events
  const filteredEvents = events.filter((event) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // Tag filter
    const matchesTags =
      selectedTags.length === 0 ||
      event.event_tag_links.some((link) =>
        selectedTags.includes(link.tag_id)
      )

    return matchesSearch && matchesTags
  })

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
  }

  const hasActiveFilters = searchQuery !== "" || selectedTags.length > 0

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="size-4" />
                {selectedTags.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {selectedTags.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tags.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tags available
                  </p>
                </div>
              ) : (
                tags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="size-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {canCreate && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId)
            if (!tag) return null
            return (
              <Badge
                key={tagId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTag(tagId)}
              >
                {tag.name}
                <X className="ml-1 size-3" />
              </Badge>
            )
          })}
        </div>
      )}

      {/* Events grid */}
      <div className="grid gap-4">
        {filteredEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No events match your search"
                : "No events yet. Create your first event to get started."}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const eventTags = event.event_tag_links
              .map((link) => link.event_tags)
              .filter(Boolean)

            const eventSkills = skills.filter((skill) => 
              event.skill_ids.includes(skill.id)
            )

            const startDate = event.metadata.start_date
            const endDate = event.metadata.end_date

            return (
              <div
                key={event.id}
                className="group cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <Diamond className="size-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium leading-none">
                          {event.name}
                        </h3>
                        {event.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pl-8">
                      {startDate && (
                        <span className="text-sm text-muted-foreground">
                          {formatIndonesianDate(startDate)}
                          {endDate && endDate !== startDate && (
                            <> - {formatIndonesianDate(endDate)}</>
                          )}
                        </span>
                      )}
                      {eventTags.length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          {eventTags.map((tag) => (
                            <Badge key={tag.id} variant="outline">
                              {tag.name}
                            </Badge>
                          ))}
                        </>
                      )}
                      {event.resource_link_ids.length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="size-4" />
                            <span>{event.resource_link_ids.length}</span>
                          </div>
                        </>
                      )}
                      {eventSkills.length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          {eventSkills.map((skill) => (
                            <Badge key={skill.id} variant="secondary">
                              {skill.name}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {(canEdit || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {canEdit && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(event)
                                  setEditDialogOpen(true)
                                }}
                              >
                                Edit Event
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(event)
                                  setManageResourcesDialogOpen(true)
                                }}
                              >
                                Manage Resources
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(event)
                                  setManageSkillsDialogOpen(true)
                                }}
                              >
                                Manage Skills
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(event)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              Delete Event
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Event Dialog */}
      <AddEventDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        organizationId={organizationId}
        tags={tags}
        onSuccess={onEventsUpdated}
      />

      {/* Edit Event Dialog */}
      <EditEventDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        organizationId={organizationId}
        event={selectedEvent}
        tags={tags}
        onSuccess={onEventsUpdated}
      />

      {/* Delete Event Dialog */}
      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        eventId={selectedEvent?.id ?? null}
        eventName={selectedEvent?.name ?? null}
        onSuccess={onEventsUpdated}
      />

      {/* Manage Event Resources Dialog */}
      <ManageEventResourcesDialog
        open={manageResourcesDialogOpen}
        onOpenChange={setManageResourcesDialogOpen}
        organizationId={organizationId}
        eventId={selectedEvent?.id ?? null}
        eventName={selectedEvent?.name ?? null}
        resources={resources}
        attachedResourceIds={selectedEvent?.resource_link_ids ?? []}
        onSuccess={onEventsUpdated}
      />

      {/* Manage Event Skills Dialog */}
      <ManageEventSkillsDialog
        open={manageSkillsDialogOpen}
        onOpenChange={setManageSkillsDialogOpen}
        organizationId={organizationId}
        eventId={selectedEvent?.id ?? null}
        eventName={selectedEvent?.name ?? null}
        skills={skills}
        requiredSkillIds={selectedEvent?.skill_ids ?? []}
        onSuccess={onEventsUpdated}
      />
    </div>
  )
}
