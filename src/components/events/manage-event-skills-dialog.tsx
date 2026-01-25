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

const PAGE_SIZE = 20

type Skill = {
  id: string
  name: string
}

type ManageEventSkillsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  eventId: string | null
  eventName: string | null
  requiredSkillIds: string[]
  onSuccess: () => void
}

export function ManageEventSkillsDialog({
  open,
  onOpenChange,
  organizationId,
  eventId,
  eventName,
  requiredSkillIds,
  onSuccess,
}: ManageEventSkillsDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [listLoading, setListLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [skillOpen, setSkillOpen] = React.useState(false)
  const [skills, setSkills] = React.useState<Skill[]>([])
  const [hasMore, setHasMore] = React.useState(true)
  const pageRef = React.useRef(0)
  const skillAnchorRef = useComboboxAnchor()
  const sheetContentRef = React.useRef<HTMLDivElement>(null)
  const [selectedSkillMap, setSelectedSkillMap] = React.useState<
    Record<string, Skill>
  >({})

  React.useEffect(() => {
    if (open) {
      setSelectedSkills(requiredSkillIds)
      setSearchQuery("")
      setSkills([])
      setHasMore(true)
      pageRef.current = 0
      setSkillOpen(false)
    }
  }, [open, requiredSkillIds])

  const selectedSkillItems = React.useMemo(
    () =>
      selectedSkills
        .map((id) => selectedSkillMap[id])
        .filter((skill): skill is Skill => Boolean(skill)),
    [selectedSkills, selectedSkillMap]
  )

  const mergedSkillList = React.useMemo(() => {
    const resultIds = new Set(skills.map((skill) => skill.id))
    const selectedNotInResults = selectedSkillItems.filter(
      (skill) => !resultIds.has(skill.id)
    )
    return [...selectedNotInResults, ...skills]
  }, [skills, selectedSkillItems])

  const displaySkillList = React.useMemo(() => {
    const selectedIds = new Set(selectedSkills)
    return skills.filter((skill) => !selectedIds.has(skill.id))
  }, [skills, selectedSkills])

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

  const fetchSkills = React.useCallback(
    async ({ reset }: { reset: boolean }) => {
      if (reset) {
        setListLoading(true)
      } else {
        setLoadingMore(true)
      }

      const targetPage = reset ? 0 : pageRef.current
      const normalizedQuery = searchQuery.trim().toLowerCase()
      const escapedQuery = normalizedQuery.replace(/[%_]/g, "\\$&")

      let query = supabase.from("skills").select("id, name")
        .eq("org_id", organizationId)

      if (escapedQuery) {
        query = query.ilike("name", `%${escapedQuery}%`)
      }

      const { data, error } = await query
        .order("name")
        .range(targetPage * PAGE_SIZE, targetPage * PAGE_SIZE + PAGE_SIZE - 1)

      if (error) {
        console.error("Failed to load skills", error)
        toast.error("Failed to load skills")
      }

      const nextItems = data ?? []

      setSkills((prev) => (reset ? nextItems : [...prev, ...nextItems]))
      pageRef.current = targetPage + 1
      setHasMore(nextItems.length === PAGE_SIZE)

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

      setListLoading(false)
      setLoadingMore(false)
    },
    [organizationId, searchQuery, selectedSkills]
  )

  React.useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      fetchSkills({ reset: true })
    }, 250)
    return () => clearTimeout(timeout)
  }, [open, searchQuery, fetchSkills])

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

  const handleSave = async () => {
    if (!eventId) return

    setLoading(true)

    const skillsToAdd = selectedSkills.filter(
      (id) => !requiredSkillIds.includes(id)
    )

    const skillsToRemove = requiredSkillIds.filter(
      (id) => !selectedSkills.includes(id)
    )

    let hasError = false

    if (skillsToAdd.length > 0) {
      const { error: addError } = await supabase
        .from("event_skill_links")
        .insert(
          skillsToAdd.map((skillId) => ({
            org_id: organizationId,
            event_id: eventId,
            skill_id: skillId,
          }))
        )

      if (addError) {
        console.error("Failed to add skills:", addError)
        hasError = true
      }
    }

    if (skillsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("event_skill_links")
        .delete()
        .eq("org_id", organizationId)
        .eq("event_id", eventId)
        .in("skill_id", skillsToRemove)

      if (removeError) {
        console.error("Failed to remove skills:", removeError)
        hasError = true
      }
    }

    setLoading(false)

    if (hasError) {
      toast.error("Some changes failed to save")
    } else if (skillsToAdd.length > 0 || skillsToRemove.length > 0) {
      toast.success("Event skills updated")
      onSuccess()
      onOpenChange(false)
    } else {
      onOpenChange(false)
    }
  }

  const hasSearch = searchQuery.trim().length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent ref={sheetContentRef} side="right" className="w-full sm:max-w-2xl p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>Required Skills: {eventName}</SheetTitle>
            <SheetDescription>
              Select skills required for this event.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {listLoading && skills.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">Loading skills...</p>
              </div>
            ) : (
              <Combobox
                items={mergedSkillList}
                multiple
                open={skillOpen}
                value={selectedSkillItems}
                onValueChange={handleSkillValueChange}
                isItemEqualToValue={(skill, selected) => skill.id === selected.id}
                onInputValueChange={(value) => setSearchQuery(value)}
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

                <ComboboxContent anchor={skillAnchorRef} container={sheetContentRef.current}>
                  <div className="px-6 pt-2 pb-1 text-xs text-muted-foreground">
                    Results ({displaySkillList.length})
                  </div>
                  {displaySkillList.length === 0 ? (
                    <ComboboxEmpty>
                      {hasSearch
                        ? "No skills match your search."
                        : "No skills available. Create skills first to assign them to events."}
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

                  {hasMore && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSkills({ reset: false })}
                        disabled={loadingMore || listLoading}
                      >
                        {loadingMore ? "Loading..." : "Load more"}
                      </Button>
                    </div>
                  )}
                </ComboboxContent>
              </Combobox>
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
