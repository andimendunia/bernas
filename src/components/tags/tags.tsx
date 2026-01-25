"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagBadge } from "@/components/ui/tag-badge"
import { Plus, Search, FileText, Calendar } from "lucide-react"
import { AddTagDialog } from "./add-tag-dialog"

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

type TagsProps = {
  organizationId: string
  tags: Tag[]
  eventTagLinks: TagLink[]
  resourceTagLinks: TagLink[]
  onTagsUpdated: () => void
}

export function Tags({
  organizationId,
  tags,
  eventTagLinks,
  resourceTagLinks,
  onTagsUpdated,
}: TagsProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)

  // Calculate usage for each tag
  const tagsWithUsage = React.useMemo(() => {
    return tags.map((tag) => {
      const eventCount = eventTagLinks.filter((link) => link.tag_id === tag.id).length
      const resourceCount = resourceTagLinks.filter((link) => link.tag_id === tag.id).length
      return {
        ...tag,
        eventCount,
        resourceCount,
        totalUsage: eventCount + resourceCount,
      }
    })
  }, [tags, eventTagLinks, resourceTagLinks])

  // Filter tags
  const filteredTags = tagsWithUsage.filter((tag) =>
    searchQuery === "" ||
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Tags can be used to categorize events and resources.
        </p>
      </div>

      {/* Search and create button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {filteredTags.length} {filteredTags.length === 1 ? "tag" : "tags"}
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Create Tag
          </Button>
        </div>
      </div>

      {/* Tags list */}
      <div className="space-y-3">
        {filteredTags.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No tags match your search"
                : "No tags yet. Create your first tag to categorize events and resources."}
            </p>
          </div>
        ) : (
          filteredTags.map((tag) => {
            return (
              <div
                key={tag.id}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-full border"
                        style={{ backgroundColor: tag.color ?? "#f2b5b5" }}
                      />
                      <TagBadge tagColor={tag.color}>
                        {tag.name}
                      </TagBadge>
                    </div>

                    {tag.totalUsage > 0 && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {tag.eventCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Calendar className="size-4" />
                            <span>{tag.eventCount}</span>
                          </div>
                        )}
                        {tag.resourceCount > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="size-4" />
                            <span>{tag.resourceCount}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {tag.totalUsage === 0 && (
                      <span className="text-sm text-muted-foreground">
                        Not used yet
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Edit/Delete buttons can be added here */}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Tag Dialog */}
      <AddTagDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        organizationId={organizationId}
        onSuccess={onTagsUpdated}
      />
    </div>
  )
}
