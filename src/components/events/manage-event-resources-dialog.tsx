"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ExternalLink, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

const PAGE_SIZE = 20

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
  attachedResourceIds: string[]
  onSuccess: () => void
}

export function ManageEventResourcesDialog({
  open,
  onOpenChange,
  organizationId,
  eventId,
  eventName,
  attachedResourceIds,
  onSuccess,
}: ManageEventResourcesDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [listLoading, setListLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [selectedResources, setSelectedResources] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [resources, setResources] = React.useState<Resource[]>([])
  const [hasMore, setHasMore] = React.useState(true)
  const [totalCount, setTotalCount] = React.useState<number | null>(null)
  const pageRef = React.useRef(0)
  const [selectedResourceMap, setSelectedResourceMap] = React.useState<
    Record<string, Resource>
  >({})

  React.useEffect(() => {
    if (open) {
      setSelectedResources(attachedResourceIds)
      setSearchQuery("")
      setResources([])
      setHasMore(true)
      setTotalCount(null)
      pageRef.current = 0
    }
  }, [open, attachedResourceIds])

  const selectedResourceItems = React.useMemo(
    () =>
      selectedResources
        .map((id) => selectedResourceMap[id])
        .filter((resource): resource is Resource => Boolean(resource)),
    [selectedResources, selectedResourceMap]
  )

  const missingSelectedResourceIds = React.useMemo(
    () => selectedResources.filter((id) => !selectedResourceMap[id]),
    [selectedResources, selectedResourceMap]
  )
  const missingSelectedResourceKey = missingSelectedResourceIds.join("|")

  const fetchSelectedResources = React.useCallback(
    async (resourceIds: string[]) => {
      if (resourceIds.length === 0) {
        setSelectedResourceMap({})
        return
      }

      const { data, error } = await supabase
        .from("resources")
        .select("id, title, url")
        .eq("org_id", organizationId)
        .in("id", resourceIds)

      if (error) {
        console.error("Failed to load selected resources", error)
        toast.error("Failed to load selected resources")
        return
      }

      const map = (data ?? []).reduce<Record<string, Resource>>((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
      setSelectedResourceMap(map)
    },
    [organizationId]
  )

  React.useEffect(() => {
    if (!open || missingSelectedResourceIds.length === 0) return
    const timeout = setTimeout(() => {
      fetchSelectedResources(missingSelectedResourceIds)
    }, 200)
    return () => clearTimeout(timeout)
  }, [open, missingSelectedResourceKey, fetchSelectedResources])

  const fetchResources = React.useCallback(
    async ({ reset }: { reset: boolean }) => {
      if (reset) {
        setListLoading(true)
      } else {
        setLoadingMore(true)
      }

      const targetPage = reset ? 0 : pageRef.current
      const normalizedQuery = searchQuery.trim().toLowerCase()
      const escapedQuery = normalizedQuery.replace(/[%_]/g, "\\$&")

      let query = supabase
        .from("resources")
        .select("id, title, url", { count: "exact" })
        .eq("org_id", organizationId)

      if (escapedQuery) {
        query = query.or(
          `title.ilike.%${escapedQuery}%,url.ilike.%${escapedQuery}%`
        )
      }

      const { data, error, count } = await query
        .order("title")
        .range(targetPage * PAGE_SIZE, targetPage * PAGE_SIZE + PAGE_SIZE - 1)

      if (error) {
        console.error("Failed to load resources", error)
        toast.error("Failed to load resources")
      }

      const nextItems = data ?? []

      setResources((prev) => (reset ? nextItems : [...prev, ...nextItems]))
      pageRef.current = targetPage + 1
      setHasMore(nextItems.length === PAGE_SIZE)
      if (reset) {
        setTotalCount(count ?? null)
      }

      setSelectedResourceMap((prev) => {
        if (selectedResources.length === 0) return prev
        const nextMap = { ...prev }
        nextItems.forEach((item) => {
          if (selectedResources.includes(item.id)) {
            nextMap[item.id] = item
          }
        })
        return nextMap
      })

      setListLoading(false)
      setLoadingMore(false)
    },
    [organizationId, searchQuery, selectedResources]
  )

  React.useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      fetchResources({ reset: true })
    }, 250)
    return () => clearTimeout(timeout)
  }, [open, searchQuery, fetchResources])

  const toggleResource = (resourceId: string) => {
    setSelectedResources((prev) => {
      const isSelected = prev.includes(resourceId)
      if (isSelected) {
        setSelectedResourceMap((prevMap) => {
          const nextMap = { ...prevMap }
          delete nextMap[resourceId]
          return nextMap
        })
        return prev.filter((id) => id !== resourceId)
      }

      const resourceItem =
        resources.find((resource) => resource.id === resourceId) ||
        selectedResourceMap[resourceId]
      if (resourceItem) {
        setSelectedResourceMap((prevMap) => ({
          ...prevMap,
          [resourceId]: resourceItem,
        }))
      }
      return [...prev, resourceId]
    })
  }

  const handleSave = async () => {
    if (!eventId) return

    setLoading(true)

    const resourcesToAdd = selectedResources.filter(
      (id) => !attachedResourceIds.includes(id)
    )

    const resourcesToRemove = attachedResourceIds.filter(
      (id) => !selectedResources.includes(id)
    )

    let hasError = false

    if (resourcesToAdd.length > 0) {
      const { error: addError } = await supabase
        .from("resource_links")
        .insert(
          resourcesToAdd.map((resourceId) => ({
            org_id: organizationId,
            resource_id: resourceId,
            linked_type: "event",
            linked_id: eventId,
          }))
        )

      if (addError) {
        console.error("Failed to add resources:", addError)
        hasError = true
      }
    }

    if (resourcesToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("resource_links")
        .delete()
        .eq("org_id", organizationId)
        .eq("linked_type", "event")
        .eq("linked_id", eventId)
        .in("resource_id", resourcesToRemove)

      if (removeError) {
        console.error("Failed to remove resources:", removeError)
        hasError = true
      }
    }

    setLoading(false)

    if (hasError) {
      toast.error("Some changes failed to save")
    } else if (resourcesToAdd.length > 0 || resourcesToRemove.length > 0) {
      toast.success("Event resources updated")
      onSuccess()
      onOpenChange(false)
    } else {
      onOpenChange(false)
    }
  }

  const hasSearch = searchQuery.trim().length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>Attach Resources: {eventName}</SheetTitle>
            <SheetDescription>
              Select resources to attach to this event.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {listLoading && resources.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Loading resources...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search resources by title or URL"
                />

                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Selected ({selectedResources.length})
                  </div>
                  {selectedResourceItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No resources selected yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedResourceItems.map((resource) => (
                        <Badge key={resource.id} variant="secondary" className="gap-1">
                          <span className="max-w-[180px] truncate">
                            {resource.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleResource(resource.id)}
                            className="rounded-full p-0.5 transition hover:bg-muted"
                            aria-label={`Remove ${resource.title}`}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Results ({totalCount ?? resources.length})
                  </div>
                  {resources.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        {hasSearch
                          ? "No resources match your search."
                          : "No resources available. Create resources first to attach them to events."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-[45vh] overflow-y-auto pr-1">
                      {resources.map((resource) => {
                        const isSelected = selectedResources.includes(resource.id)
                        return (
                          <div
                            key={resource.id}
                            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-accent"
                            }`}
                            onClick={() => toggleResource(resource.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleResource(resource.id)}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Select ${resource.title}`}
                            />
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <ExternalLink className="size-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {resource.title}
                                </div>
                                {resource.url && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {resource.url}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {hasMore && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchResources({ reset: false })}
                        disabled={loadingMore || listLoading}
                      >
                        {loadingMore ? "Loading..." : "Load more"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
