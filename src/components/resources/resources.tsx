"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagBadge } from "@/components/ui/tag-badge"
import { Plus, ExternalLink, Search, Filter, X, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { AddResourceDialog } from "./add-resource-dialog"
import { EditResourceDialog } from "./edit-resource-dialog"
import { DeleteResourceDialog } from "./delete-resource-dialog"

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

type ResourcesProps = {
  organizationId: string
  resources: Resource[]
  tags: Tag[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  onResourceUpdated: () => void
}

export function Resources({
  organizationId,
  resources,
  tags,
  canCreate,
  canEdit,
  canDelete,
  onResourceUpdated,
}: ResourcesProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedResource, setSelectedResource] = React.useState<Resource | null>(null)

  // Filter resources
  const filteredResources = resources.filter((resource) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // Tag filter
    const matchesTags =
      selectedTags.length === 0 ||
      resource.resource_tag_links.some((link) =>
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
              placeholder="Search resources..."
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
            Add Resource
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
              <TagBadge
                key={tagId}
                tagColor={tag.color}
                className="cursor-pointer"
                onClick={() => toggleTag(tagId)}
              >
                {tag.name}
                <X className="ml-1 size-3" />
              </TagBadge>
            )
          })}
        </div>
      )}

      {/* Resources list */}
      <div className="space-y-3">
        {filteredResources.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No resources match your filters"
                : "No resources yet. Add your first resource to get started."}
            </p>
          </div>
        ) : (
          filteredResources.map((resource) => {
            const resourceTags = resource.resource_tag_links
              .map((link) => link.event_tags)
              .filter(Boolean)

            const eventCount = resource.resource_links.filter(
              (link) => link.linked_type === "event"
            ).length

            return (
              <div
                key={resource.id}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <ExternalLink className="size-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="font-medium leading-none">
                          {resource.title}
                        </h3>
                        {resource.description && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pl-7">
                      {resourceTags.map((tag) => (
                        <TagBadge key={tag.id} tagColor={tag.color}>
                          {tag.name}
                        </TagBadge>
                      ))}
                      {eventCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          • {eventCount} {eventCount === 1 ? "event" : "events"}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        • {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {resource.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open
                        </a>
                      </Button>
                    )}
                    {(canEdit || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedResource(resource)
                                setEditDialogOpen(true)
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedResource(resource)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              Delete
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

      {/* Results count */}
      {filteredResources.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredResources.length} of {resources.length}{" "}
          {resources.length === 1 ? "resource" : "resources"}
        </div>
      )}

      {/* Add Resource Dialog */}
      <AddResourceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        organizationId={organizationId}
        tags={tags}
        onSuccess={onResourceUpdated}
      />

      {/* Edit Resource Dialog */}
      <EditResourceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        organizationId={organizationId}
        resource={selectedResource}
        tags={tags}
        onSuccess={onResourceUpdated}
      />

      {/* Delete Resource Dialog */}
      <DeleteResourceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        resourceId={selectedResource?.id ?? null}
        resourceTitle={selectedResource?.title ?? null}
        onSuccess={onResourceUpdated}
      />
    </div>
  )
}
