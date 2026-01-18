"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type Tag = {
  id: string
  name: string
  color: string | null
}

type Event = {
  id: string
  name: string
  description: string | null
  metadata: {
    start_date?: string
    end_date?: string | null
  }
  event_tag_links: {
    tag_id: string
  }[]
}

type EditEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  event: Event | null
  tags: Tag[]
  onSuccess: () => void
}

export function EditEventDialog({
  open,
  onOpenChange,
  organizationId,
  event,
  tags,
  onSuccess,
}: EditEventDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  // Reset form when event changes
  React.useEffect(() => {
    if (open && event) {
      setName(event.name)
      setDescription(event.description ?? "")
      setStartDate(event.metadata.start_date ?? "")
      setEndDate(event.metadata.end_date ?? "")
      setSelectedTags(event.event_tag_links.map((link) => link.tag_id))
    }
  }, [open, event])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return

    setLoading(true)

    // Validate dates
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setLoading(false)
      toast.error('End date must be after start date')
      return
    }

    // Update event
    const { error: eventError } = await supabase
      .from('events')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        metadata: {
          start_date: startDate,
          end_date: endDate || null,
        },
      })
      .eq('id', event.id)

    if (eventError) {
      setLoading(false)
      toast.error('Failed to update event')
      console.error(eventError)
      return
    }

    // Delete existing tag links
    await supabase
      .from('event_tag_links')
      .delete()
      .eq('event_id', event.id)

    // Insert new tag links if any tags selected
    if (selectedTags.length > 0) {
      const tagLinks = selectedTags.map((tagId) => ({
        org_id: organizationId,
        event_id: event.id,
        tag_id: tagId,
      }))

      const { error: tagLinksError } = await supabase
        .from('event_tag_links')
        .insert(tagLinks)

      if (tagLinksError) {
        console.error('Failed to create tag links:', tagLinksError)
        // Don't fail the whole operation, just log it
      }
    }

    setLoading(false)
    toast.success('Event updated successfully')
    onSuccess()
    onOpenChange(false)
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">
              Event Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bi-monthly Discussion: Identity"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description (optional)</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this event"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date (optional)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for single-day events
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags available.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.id) && (
                        <X className="ml-1 size-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click tags to add/remove them.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
