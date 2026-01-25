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
import { TagBadge } from "@/components/ui/tag-badge"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type Tag = {
  id: string
  name: string
  color: string | null
}

type AddResourceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  tags: Tag[]
  onSuccess: () => void
}

export function AddResourceDialog({
  open,
  onOpenChange,
  organizationId,
  tags,
  onSuccess,
}: AddResourceDialogProps) {
  const [title, setTitle] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setTitle("")
      setUrl("")
      setDescription("")
      setSelectedTags([])
    }
  }, [open])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      toast.error('You must be logged in to create resources')
      return
    }

    // Insert resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        org_id: organizationId,
        title: title.trim(),
        description: description.trim() || null,
        type: 'link',
        url: url.trim(),
        created_by: user.id,
      })
      .select()
      .single()

    if (resourceError) {
      setLoading(false)
      toast.error('Failed to create resource')
      console.error(resourceError)
      return
    }

    // Insert tag links if any tags selected
    if (selectedTags.length > 0 && resource) {
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
    toast.success('Resource created successfully')
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
          <DialogDescription>
            Add a document, link, or file to your organization's resource library.
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
                No tags available. Create tags first to categorize resources.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      tagColor={tag.color}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.id) && (
                        <X className="ml-1 size-3" />
                      )}
                    </TagBadge>
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
              {loading ? "Creating..." : "Create Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
