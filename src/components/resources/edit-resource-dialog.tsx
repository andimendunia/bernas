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

type Resource = {
  id: string
  title: string
  description: string | null
  url: string | null
  resource_tag_links: {
    tag_id: string
  }[]
}

type EditResourceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  resource: Resource | null
  tags: Tag[]
  onSuccess: () => void
}

export function EditResourceDialog({
  open,
  onOpenChange,
  organizationId,
  resource,
  tags,
  onSuccess,
}: EditResourceDialogProps) {
  const [title, setTitle] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  // Load resource data when dialog opens
  React.useEffect(() => {
    if (open && resource) {
      setTitle(resource.title)
      setUrl(resource.url ?? "")
      setDescription(resource.description ?? "")
      setSelectedTags(resource.resource_tag_links.map((link) => link.tag_id))
    }
  }, [open, resource])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resource) return

    setLoading(true)

    // Update resource
    const { error: resourceError } = await supabase
      .from('resources')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim(),
      })
      .eq('id', resource.id)

    if (resourceError) {
      setLoading(false)
      toast.error('Failed to update resource')
      console.error(resourceError)
      return
    }

    // Delete existing tag links
    await supabase
      .from('resource_tag_links')
      .delete()
      .eq('resource_id', resource.id)

    // Insert new tag links if any tags selected
    if (selectedTags.length > 0) {
      const tagLinks = selectedTags.map((tagId) => ({
        org_id: organizationId,
        resource_id: resource.id,
        tag_id: tagId,
      }))

      const { error: tagLinksError } = await supabase
        .from('resource_tag_links')
        .insert(tagLinks)

      if (tagLinksError) {
        console.error('Failed to create tag links:', tagLinksError)
        // Don't fail the whole operation, just log it
      }
    }

    setLoading(false)
    toast.success('Resource updated successfully')
    onSuccess()
    onOpenChange(false)
  }

  if (!resource) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>
            Update resource information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resource-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Grant Application Template 2024"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-url">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resource-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Link to Google Docs, external website, or any online resource.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-description">Description (optional)</Label>
            <Textarea
              id="resource-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this resource"
              rows={3}
            />
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
