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
import { Badge } from "@/components/ui/badge"
import { Check, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type Resource = {
  id: string
  title: string
  url: string | null
}

type ManageEventResourcesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  eventId: string | null
  eventName: string | null
  resources: Resource[]
  attachedResourceIds: string[]
  onSuccess: () => void
}

export function ManageEventResourcesDialog({
  open,
  onOpenChange,
  organizationId,
  eventId,
  eventName,
  resources,
  attachedResourceIds,
  onSuccess,
}: ManageEventResourcesDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [selectedResources, setSelectedResources] = React.useState<string[]>([])

  // Initialize selected resources when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedResources(attachedResourceIds)
    }
  }, [open, attachedResourceIds])

  const toggleResource = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    )
  }

  const handleSave = async () => {
    if (!eventId) return

    setLoading(true)

    // Find resources to add
    const resourcesToAdd = selectedResources.filter(
      (id) => !attachedResourceIds.includes(id)
    )

    // Find resources to remove
    const resourcesToRemove = attachedResourceIds.filter(
      (id) => !selectedResources.includes(id)
    )

    let hasError = false

    // Add new resource links
    if (resourcesToAdd.length > 0) {
      const { error: addError } = await supabase
        .from('resource_links')
        .insert(
          resourcesToAdd.map((resourceId) => ({
            org_id: organizationId,
            resource_id: resourceId,
            linked_type: 'event',
            linked_id: eventId,
          }))
        )

      if (addError) {
        console.error('Failed to add resources:', addError)
        hasError = true
      }
    }

    // Remove resource links
    if (resourcesToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('resource_links')
        .delete()
        .eq('org_id', organizationId)
        .eq('linked_type', 'event')
        .eq('linked_id', eventId)
        .in('resource_id', resourcesToRemove)

      if (removeError) {
        console.error('Failed to remove resources:', removeError)
        hasError = true
      }
    }

    setLoading(false)

    if (hasError) {
      toast.error('Some changes failed to save')
    } else if (resourcesToAdd.length > 0 || resourcesToRemove.length > 0) {
      toast.success('Event resources updated')
      onSuccess()
      onOpenChange(false)
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach Resources: {eventName}</DialogTitle>
          <DialogDescription>
            Select resources to attach to this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {resources.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No resources available. Create resources first to attach them to events.
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                {selectedResources.length} of {resources.length} resources selected
              </div>

              <div className="grid gap-2">
                {resources.map((resource) => {
                  const isSelected = selectedResources.includes(resource.id)
                  return (
                    <div
                      key={resource.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleResource(resource.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ExternalLink className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{resource.title}</div>
                          {resource.url && (
                            <div className="text-xs text-muted-foreground truncate">
                              {resource.url}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="size-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || resources.length === 0}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
