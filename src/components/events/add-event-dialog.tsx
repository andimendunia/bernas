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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagBadge } from "@/components/ui/tag-badge"
import { SkillBadge } from "@/components/ui/skill-badge"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

const TAG_PAGE_SIZE = 25
const SKILL_PAGE_SIZE = 20

type Tag = {
  id: string
  name: string
  color: string | null
}

type Skill = {
  id: string
  name: string
}

type AddEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess: () => void
}

export function AddEventDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: AddEventDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [tagSearch, setTagSearch] = React.useState("")
  const [tagOpen, setTagOpen] = React.useState(false)
  const [tagList, setTagList] = React.useState<Tag[]>([])
  const [tagHasMore, setTagHasMore] = React.useState(true)
  const [tagTotalCount, setTagTotalCount] = React.useState<number | null>(null)
  const [tagLoading, setTagLoading] = React.useState(false)
  const [tagLoadingMore, setTagLoadingMore] = React.useState(false)
  const [selectedTagMap, setSelectedTagMap] = React.useState<Record<string, Tag>>(
    {}
  )
  const tagPageRef = React.useRef(0)
  const tagAnchorRef = useComboboxAnchor()
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([])
  const [skillSearch, setSkillSearch] = React.useState("")
  const [skillOpen, setSkillOpen] = React.useState(false)
  const [skillList, setSkillList] = React.useState<Skill[]>([])
  const [skillHasMore, setSkillHasMore] = React.useState(true)
  const [skillLoading, setSkillLoading] = React.useState(false)
  const [skillLoadingMore, setSkillLoadingMore] = React.useState(false)
  const [selectedSkillMap, setSelectedSkillMap] = React.useState<
    Record<string, Skill>
  >({})
  const skillPageRef = React.useRef(0)
  const skillAnchorRef = useComboboxAnchor()
  const comboboxPortalRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setSelectedTags([])
      setTagSearch("")
      setTagList([])
      setTagHasMore(true)
      setTagTotalCount(null)
      tagPageRef.current = 0
      setTagOpen(false)
      setSelectedSkills([])
      setSkillSearch("")
      setSkillList([])
      setSkillHasMore(true)
      skillPageRef.current = 0
      setSkillOpen(false)
    }
  }, [open])

  const selectedTagItems = React.useMemo(
    () =>
      selectedTags
        .map((id) => selectedTagMap[id])
        .filter((tag): tag is Tag => Boolean(tag)),
    [selectedTags, selectedTagMap]
  )

  // Merge selected items with search results so they remain available for selection tracking
  // But we'll filter them out when rendering to avoid duplicates
  const mergedTagList = React.useMemo(() => {
    const resultIds = new Set(tagList.map((t) => t.id))
    const selectedNotInResults = selectedTagItems.filter(
      (tag) => !resultIds.has(tag.id)
    )
    return [...selectedNotInResults, ...tagList]
  }, [tagList, selectedTagItems])

  // For display: only show items that aren't already selected (chips show selected)
  const displayTagList = React.useMemo(() => {
    const selectedIds = new Set(selectedTags)
    return tagList.filter((tag) => !selectedIds.has(tag.id))
  }, [tagList, selectedTags])

  const selectedSkillItems = React.useMemo(
    () =>
      selectedSkills
        .map((id) => selectedSkillMap[id])
        .filter((skill): skill is Skill => Boolean(skill)),
    [selectedSkills, selectedSkillMap]
  )

  const mergedSkillList = React.useMemo(() => {
    const resultIds = new Set(skillList.map((skill) => skill.id))
    const selectedNotInResults = selectedSkillItems.filter(
      (skill) => !resultIds.has(skill.id)
    )
    return [...selectedNotInResults, ...skillList]
  }, [skillList, selectedSkillItems])

  const displaySkillList = React.useMemo(() => {
    const selectedIds = new Set(selectedSkills)
    return skillList.filter((skill) => !selectedIds.has(skill.id))
  }, [skillList, selectedSkills])

  const missingSelectedTagIds = React.useMemo(
    () => selectedTags.filter((id) => !selectedTagMap[id]),
    [selectedTags, selectedTagMap]
  )
  const missingSelectedTagKey = missingSelectedTagIds.join("|")

  const fetchSelectedTags = React.useCallback(
    async (tagIds: string[]) => {
      if (tagIds.length === 0) {
        setSelectedTagMap({})
        return
      }

      const { data, error } = await supabase
        .from("event_tags")
        .select("id, name, color")
        .eq("org_id", organizationId)
        .in("id", tagIds)

      if (error) {
        console.error("Failed to load selected tags", error)
        toast.error("Failed to load selected tags")
        return
      }

      const map = (data ?? []).reduce<Record<string, Tag>>((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
      setSelectedTagMap(map)
    },
    [organizationId]
  )

  React.useEffect(() => {
    if (!open || missingSelectedTagIds.length === 0) return
    const timeout = setTimeout(() => {
      fetchSelectedTags(missingSelectedTagIds)
    }, 200)
    return () => clearTimeout(timeout)
  }, [open, missingSelectedTagKey, fetchSelectedTags])

  const missingSelectedSkillIds = React.useMemo(
    () => selectedSkills.filter((id) => !selectedSkillMap[id]),
    [selectedSkills, selectedSkillMap]
  )
  const missingSelectedSkillKey = missingSelectedSkillIds.join("|")

  const fetchSelectedSkills = React.useCallback(
    async (skillIds: string[]) => {
      if (skillIds.length === 0) {
        setSelectedSkillMap({})
        return
      }

      const { data, error } = await supabase
        .from("skills")
        .select("id, name")
        .eq("org_id", organizationId)
        .in("id", skillIds)

      if (error) {
        console.error("Failed to load selected skills", error)
        toast.error("Failed to load selected skills")
        return
      }

      const map = (data ?? []).reduce<Record<string, Skill>>((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})
      setSelectedSkillMap(map)
    },
    [organizationId]
  )

  React.useEffect(() => {
    if (!open || missingSelectedSkillIds.length === 0) return
    const timeout = setTimeout(() => {
      fetchSelectedSkills(missingSelectedSkillIds)
    }, 200)
    return () => clearTimeout(timeout)
  }, [open, missingSelectedSkillKey, fetchSelectedSkills])

  const fetchTags = React.useCallback(
    async ({ reset }: { reset: boolean }) => {
      if (reset) {
        setTagLoading(true)
      } else {
        setTagLoadingMore(true)
      }

      const targetPage = reset ? 0 : tagPageRef.current
      const normalizedQuery = tagSearch.trim().toLowerCase()
      const escapedQuery = normalizedQuery.replace(/[%_]/g, "\\$&")

      let query = supabase
        .from("event_tags")
        .select("id, name, color", { count: "exact" })
        .eq("org_id", organizationId)

      if (escapedQuery) {
        query = query.ilike("name", `%${escapedQuery}%`)
      }

      const { data, error, count } = await query
        .order("name")
        .range(
          targetPage * TAG_PAGE_SIZE,
          targetPage * TAG_PAGE_SIZE + TAG_PAGE_SIZE - 1
        )

      if (error) {
        console.error("Failed to load tags", error)
        toast.error("Failed to load tags")
      }

      const nextItems = data ?? []
      setTagList((prev) => (reset ? nextItems : [...prev, ...nextItems]))
      tagPageRef.current = targetPage + 1
      setTagHasMore(nextItems.length === TAG_PAGE_SIZE)
      if (reset) {
        setTagTotalCount(count ?? null)
      }

      setSelectedTagMap((prev) => {
        if (selectedTags.length === 0) return prev
        const nextMap = { ...prev }
        nextItems.forEach((item) => {
          if (selectedTags.includes(item.id)) {
            nextMap[item.id] = item
          }
        })
        return nextMap
      })

      setTagLoading(false)
      setTagLoadingMore(false)
    },
    [organizationId, tagSearch, selectedTags]
  )

  const fetchSkills = React.useCallback(
    async ({ reset }: { reset: boolean }) => {
      if (reset) {
        setSkillLoading(true)
      } else {
        setSkillLoadingMore(true)
      }

      const targetPage = reset ? 0 : skillPageRef.current
      const normalizedQuery = skillSearch.trim().toLowerCase()
      const escapedQuery = normalizedQuery.replace(/[%_]/g, "\\$&")

      let query = supabase.from("skills").select("id, name").eq("org_id", organizationId)

      if (escapedQuery) {
        query = query.ilike("name", `%${escapedQuery}%`)
      }

      const { data, error } = await query
        .order("name")
        .range(
          targetPage * SKILL_PAGE_SIZE,
          targetPage * SKILL_PAGE_SIZE + SKILL_PAGE_SIZE - 1
        )

      if (error) {
        console.error("Failed to load skills", error)
        toast.error("Failed to load skills")
      }

      const nextItems = data ?? []
      setSkillList((prev) => (reset ? nextItems : [...prev, ...nextItems]))
      skillPageRef.current = targetPage + 1
      setSkillHasMore(nextItems.length === SKILL_PAGE_SIZE)

      setSelectedSkillMap((prev) => {
        if (selectedSkills.length === 0) return prev
        const nextMap = { ...prev }
        nextItems.forEach((item) => {
          if (selectedSkills.includes(item.id)) {
            nextMap[item.id] = item
          }
        })
        return nextMap
      })

      setSkillLoading(false)
      setSkillLoadingMore(false)
    },
    [organizationId, skillSearch, selectedSkills]
  )

  React.useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      fetchTags({ reset: true })
    }, 250)
    return () => clearTimeout(timeout)
  }, [open, tagSearch, fetchTags])

  React.useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      fetchSkills({ reset: true })
    }, 250)
    return () => clearTimeout(timeout)
  }, [open, skillSearch, fetchSkills])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      toast.error("You must be logged in to create events")
      return
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setLoading(false)
      toast.error("End date must be after start date")
      return
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        org_id: organizationId,
        name: name.trim(),
        description: description.trim() || null,
        metadata: {
          start_date: startDate,
          end_date: endDate || null,
        },
        created_by: user.id,
      })
      .select()
      .single()

    if (eventError) {
      setLoading(false)
      toast.error("Failed to create event")
      console.error(eventError)
      return
    }

    if (selectedTags.length > 0 && event) {
      const tagLinks = selectedTags.map((tagId) => ({
        org_id: organizationId,
        event_id: event.id,
        tag_id: tagId,
      }))

      const { error: tagLinksError } = await supabase
        .from("event_tag_links")
        .insert(tagLinks)

      if (tagLinksError) {
        console.error("Failed to create tag links:", tagLinksError)
      }
    }

    if (selectedSkills.length > 0 && event) {
      const skillLinks = selectedSkills.map((skillId) => ({
        org_id: organizationId,
        event_id: event.id,
        skill_id: skillId,
      }))

      const { error: skillLinksError } = await supabase
        .from("event_skill_links")
        .insert(skillLinks)

      if (skillLinksError) {
        console.error("Failed to create skill links:", skillLinksError)
      }
    }

    setLoading(false)
    toast.success("Event created successfully")
    onSuccess()
    onOpenChange(false)
  }

  const tagSearchActive = tagSearch.trim().length > 0
  const skillSearchActive = skillSearch.trim().length > 0

  const handleTagValueChange = (nextTags: Tag[] | null) => {
    const nextArray = nextTags ?? []
    setSelectedTags(nextArray.map((tag) => tag.id))
    setSelectedTagMap(() =>
      nextArray.reduce<Record<string, Tag>>((acc, tag) => {
        acc[tag.id] = tag
        return acc
      }, {})
    )
  }

  const handleSkillValueChange = (nextSkills: Skill[] | null) => {
    const nextArray = nextSkills ?? []
    setSelectedSkills(nextArray.map((skill) => skill.id))
    setSelectedSkillMap(() =>
      nextArray.reduce<Record<string, Skill>>((acc, skill) => {
        acc[skill.id] = skill
        return acc
      }, {})
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <div className="relative flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>Create New Event</SheetTitle>
            <SheetDescription>
              Add a new event for your organization.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="add-event-form" onSubmit={handleSubmit} className="space-y-4">
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
                  rows={2}
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
                <Combobox
                  items={mergedTagList}
                  multiple
                  open={tagOpen}
                  value={selectedTagItems}
                  onValueChange={handleTagValueChange}
                  isItemEqualToValue={(tag, selected) => tag.id === selected.id}
                  onInputValueChange={(value) => setTagSearch(value)}
                  onOpenChange={(open, details) => {
                    // Close on escape key, focus-out, or outside-press
                    // Only prevent close for things like item selection
                    const allowedCloseReasons = ["escape-key", "focus-out", "outside-press"]
                    if (!open && !allowedCloseReasons.includes(details?.reason || "")) {
                      return // Don't update state, keep it open
                    }
                    setTagOpen(open)
                  }}
                  autoHighlight
                >
                  <ComboboxChips ref={tagAnchorRef} className="mb-3">
                    <ComboboxValue>
                      {(values: Tag[]) => (
                        <React.Fragment>
                          {values.map((tag) => (
                            <ComboboxChip key={tag.id}>
                              <TagBadge tagColor={tag.color}>
                                {tag.name}
                              </TagBadge>
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Search tags" />
                        </React.Fragment>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>

                  <ComboboxContent anchor={tagAnchorRef} container={comboboxPortalRef.current}>
                    <div className="px-6 pt-2 pb-1 text-xs text-muted-foreground">
                      {tagSearchActive
                        ? `Search results (${displayTagList.length})`
                        : `Results (${displayTagList.length})`}
                    </div>
                    {displayTagList.length === 0 ? (
                      <ComboboxEmpty>
                        {tagLoading && tagList.length === 0
                          ? "Loading tags..."
                          : tagSearchActive
                            ? "No tags match your search."
                            : "No tags available. Create tags first to categorize events."}
                      </ComboboxEmpty>
                    ) : (
                      <ComboboxList>
                        {displayTagList.map((tag) => (
                          <ComboboxItem key={tag.id} value={tag}>
                            <TagBadge tagColor={tag.color}>{tag.name}</TagBadge>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    )}

                    {tagHasMore && (
                      <div className="mt-2 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fetchTags({ reset: false })}
                          disabled={tagLoadingMore || tagLoading}
                        >
                          {tagLoadingMore ? "Loading..." : "Load more"}
                        </Button>
                      </div>
                    )}
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="space-y-2">
                <Label>Skills (optional)</Label>
                <Combobox
                  items={mergedSkillList}
                  multiple
                  open={skillOpen}
                  value={selectedSkillItems}
                  onValueChange={handleSkillValueChange}
                  isItemEqualToValue={(skill, selected) => skill.id === selected.id}
                  onInputValueChange={(value) => setSkillSearch(value)}
                  onOpenChange={(open, details) => {
                    const allowedCloseReasons = ["escape-key", "focus-out", "outside-press"]
                    if (!open && !allowedCloseReasons.includes(details?.reason || "")) {
                      return
                    }
                    setSkillOpen(open)
                  }}
                  autoHighlight
                >
                  <ComboboxChips ref={skillAnchorRef} className="mb-3">
                    <ComboboxValue>
                      {(values: Skill[]) => (
                        <React.Fragment>
                          {values.map((skill) => (
                            <ComboboxChip key={skill.id}>
                              <SkillBadge>{skill.name}</SkillBadge>
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Search skills" />
                        </React.Fragment>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>

                  <ComboboxContent anchor={skillAnchorRef} container={comboboxPortalRef.current}>
                    <div className="px-6 pt-2 pb-1 text-xs text-muted-foreground">
                      {skillSearchActive
                        ? `Search results (${displaySkillList.length})`
                        : `Results (${displaySkillList.length})`}
                    </div>
                    {displaySkillList.length === 0 ? (
                      <ComboboxEmpty>
                        {skillLoading && skillList.length === 0
                          ? "Loading skills..."
                          : skillSearchActive
                            ? "No skills match your search."
                            : "No skills available. Create skills first to assign them."}
                      </ComboboxEmpty>
                    ) : (
                      <ComboboxList>
                        {displaySkillList.map((skill) => (
                          <ComboboxItem key={skill.id} value={skill}>
                            <SkillBadge>{skill.name}</SkillBadge>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    )}

                    {skillHasMore && (
                      <div className="mt-2 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSkills({ reset: false })}
                          disabled={skillLoadingMore || skillLoading}
                        >
                          {skillLoadingMore ? "Loading..." : "Load more"}
                        </Button>
                      </div>
                    )}
                  </ComboboxContent>
                </Combobox>
              </div>
            </form>
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
              <Button form="add-event-form" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </SheetFooter>
          <div ref={comboboxPortalRef} className="absolute inset-0 pointer-events-none" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
