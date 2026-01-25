"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "@/components/ui/skill-badge"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { toast } from "sonner"

import { createTask } from "@/app/[orgSlug]/events/[id]/actions"
import type { EventOrgMember, EventSkill } from "@/components/events/event-detail"
import type { EventParticipation } from "./task-types"

type AddTaskDialogProps = {
  eventId: string
  orgId: string
  participations: EventParticipation[]
  allMembers: EventOrgMember[]
  eventSkills: EventSkill[]
  allSkills: EventSkill[]
  onTaskAdded: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

type MemberWithSkills = EventOrgMember

type AssigneeOption = {
  id: string
  label: string
  member: MemberWithSkills | null
  isParticipant: boolean
}

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
]

const getMemberName = (member: EventOrgMember) => {
  const metadata = member.users?.user_metadata as Record<string, unknown> | null
  const fullName = metadata?.full_name
  const name = metadata?.name

  if (typeof fullName === "string" && fullName.trim().length > 0) return fullName
  if (typeof name === "string" && name.trim().length > 0) return name
  if (member.users?.email) return member.users.email
  return "Unknown member"
}

const getMemberEmail = (member: EventOrgMember) => {
  return member.users?.email ?? ""
}

const normalizeSearch = (value: string) => value.trim().toLowerCase()

const extractMemberSkillIds = (member: MemberWithSkills) => {
  const ids: string[] = []

  member.member_skills?.forEach((skillLink) => {
    if (typeof skillLink.skill_id === "string") {
      ids.push(skillLink.skill_id)
    }
  })

  return Array.from(new Set(ids))
}

export function AddTaskDialog({
  eventId,
  orgId,
  participations,
  allMembers,
  eventSkills,
  allSkills,
  onTaskAdded,
  trigger,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: AddTaskDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = typeof openProp === "boolean"
  const dialogOpen = isControlled ? openProp : internalOpen
  const setDialogOpen = isControlled ? onOpenChange ?? (() => {}) : setInternalOpen
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState("todo")
  const [deadline, setDeadline] = React.useState("")
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null)
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([])
  const [assigneeSearch, setAssigneeSearch] = React.useState("")
  const [skillSearch, setSkillSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const assigneeAnchorRef = useComboboxAnchor()
  const skillsAnchorRef = useComboboxAnchor()

  React.useEffect(() => {
    if (!dialogOpen) return
    setTitle("")
    setDescription("")
    setStatus("todo")
    setDeadline("")
    setSelectedMemberId(null)
    setSelectedSkills([])
    setAssigneeSearch("")
    setSkillSearch("")
  }, [dialogOpen])

  const participationMap = React.useMemo(() => {
    return new Map(participations.map((p) => [p.member_id, p.status]))
  }, [participations])

  const getParticipationStatus = React.useCallback(
    (memberId: string) => participationMap.get(memberId) ?? null,
    [participationMap]
  )

  const isParticipant = React.useCallback(
    (memberId: string) => {
      const status = participationMap.get(memberId)
      return status === "full" || status === "partial"
    },
    [participationMap]
  )

  const allMembersWithSkills = allMembers as MemberWithSkills[]

  const memberSkillMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>()
    allMembersWithSkills.forEach((member) => {
      map.set(member.id, new Set(extractMemberSkillIds(member)))
    })
    return map
  }, [allMembersWithSkills])

  const memberHasRequiredSkills = React.useCallback(
    (memberId: string) => {
      if (selectedSkills.length === 0) return false
      const skillSet = memberSkillMap.get(memberId)
      if (!skillSet || skillSet.size === 0) return false
      return selectedSkills.some((skillId) => skillSet.has(skillId))
    },
    [memberSkillMap, selectedSkills]
  )

  const orderedSkills = React.useMemo(() => {
    const eventSkillIds = new Set(eventSkills.map((skill) => skill.id))
    const remainingSkills = allSkills.filter((skill) => !eventSkillIds.has(skill.id))
    return [...eventSkills, ...remainingSkills]
  }, [eventSkills, allSkills])

  const skillSearchValue = normalizeSearch(skillSearch)
  const filteredSkills = React.useMemo(() => {
    if (!skillSearchValue) return orderedSkills
    return orderedSkills.filter((skill) =>
      normalizeSearch(skill.name).includes(skillSearchValue)
    )
  }, [orderedSkills, skillSearchValue])

  const selectedSkillItems = React.useMemo(
    () =>
      selectedSkills
        .map((id) => orderedSkills.find((skill) => skill.id === id))
        .filter((skill): skill is EventSkill => Boolean(skill)),
    [selectedSkills, orderedSkills]
  )

  const displaySkillList = React.useMemo(() => {
    const selectedIds = new Set(selectedSkills)
    return filteredSkills.filter((skill) => !selectedIds.has(skill.id))
  }, [filteredSkills, selectedSkills])

  const searchValue = normalizeSearch(assigneeSearch)

  // Categorize members into exclusive sections (no duplicates)
  const categorizedMembers = React.useMemo(() => {
    const hasSkills: MemberWithSkills[] = []
    const participating: MemberWithSkills[] = []
    const others: MemberWithSkills[] = []
    const notParticipating: MemberWithSkills[] = []

    allMembersWithSkills.forEach((member) => {
      const participationStatus = getParticipationStatus(member.id)
      const hasRequiredSkills = memberHasRequiredSkills(member.id)

      // Priority 1: Has required skills (but NOT declined)
      if (hasRequiredSkills && participationStatus !== "declined") {
        hasSkills.push(member)
      }
      // Priority 2: Participating (full/partial) without skill match
      else if (participationStatus === "full" || participationStatus === "partial") {
        participating.push(member)
      }
      // Priority 3: Not participating (declined)
      else if (participationStatus === "declined") {
        notParticipating.push(member)
      }
      // Priority 4: Other members (no participation record)
      else {
        others.push(member)
      }
    })

    return { hasSkills, participating, others, notParticipating }
  }, [allMembersWithSkills, getParticipationStatus, memberHasRequiredSkills])

  // Apply search filter to each category
  const filterMembers = (members: MemberWithSkills[]) => {
    if (!searchValue) return members
    return members.filter((member) => {
      const name = normalizeSearch(getMemberName(member))
      const email = normalizeSearch(getMemberEmail(member))
      return name.includes(searchValue) || email.includes(searchValue)
    })
  }

  const filteredHasSkills = filterMembers(categorizedMembers.hasSkills)
  const filteredParticipating = filterMembers(categorizedMembers.participating)
  const filteredOthers = filterMembers(categorizedMembers.others)
  const filteredNotParticipating = filterMembers(categorizedMembers.notParticipating)

  const hasAnyAssigneeResults =
    filteredHasSkills.length > 0 ||
    filteredParticipating.length > 0 ||
    filteredOthers.length > 0 ||
    filteredNotParticipating.length > 0

  const assigneeOptions = React.useMemo<AssigneeOption[]>(() => {
    const allOptions: AssigneeOption[] = []
    
    // Add all members as options
    allMembersWithSkills.forEach((member) => {
      const participationStatus = getParticipationStatus(member.id)
      allOptions.push({
        id: member.id,
        label: getMemberName(member),
        member,
        isParticipant: participationStatus === "full" || participationStatus === "partial",
      })
    })
    
    return allOptions
  }, [allMembersWithSkills, getParticipationStatus])

  const assigneeOptionMap = React.useMemo(() => {
    return new Map(assigneeOptions.map((option) => [option.id, option]))
  }, [assigneeOptions])

  const selectedAssignee = selectedMemberId 
    ? [assigneeOptionMap.get(selectedMemberId)].filter(Boolean) as AssigneeOption[]
    : []

  const handleAssigneeChange = (next: AssigneeOption[] | null) => {
    const nextArray = next ?? []
    if (nextArray.length === 0) {
      setSelectedMemberId(null)
      setAssigneeSearch("")
      return
    }
    setSelectedMemberId(nextArray[0].id)
    setAssigneeSearch("")
  }

  const handleSkillChange = (nextSkills: EventSkill[] | null) => {
    const nextArray = nextSkills ?? []
    setSelectedSkills(nextArray.map((skill) => skill.id))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    formData.append("orgId", orgId)
    formData.append("eventId", eventId)
    formData.set("status", status)
    formData.set("assigneeMemberId", selectedMemberId ?? "")
    formData.append(
      "deadline",
      deadline ? new Date(`${deadline}T00:00:00`).toISOString() : ""
    )
    formData.append("skillIds", JSON.stringify(selectedSkills))

    const result = await createTask(formData)

    if (result.success) {
      toast.success("Task created successfully")
      setDialogOpen(false)
      onTaskAdded()
    } else {
      toast.error(result.error ?? "Failed to create task")
    }

    setLoading(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger ?? <Button>Create Task</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Create a new task for this event.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="task-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g., Confirm venue layout"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description (optional)</Label>
            <Textarea
              id="task-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add details for the assignee"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={status} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-deadline">Deadline (optional)</Label>
              <Input
                id="task-deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignee (optional)</Label>
            <Combobox
              items={assigneeOptions}
              multiple
              value={selectedAssignee}
              onValueChange={handleAssigneeChange}
              isItemEqualToValue={(option, selected) => option.id === selected.id}
              inputValue={assigneeSearch}
              onInputValueChange={(value) => setAssigneeSearch(value)}
              autoHighlight
            >
              <ComboboxChips ref={assigneeAnchorRef}>
                <ComboboxValue>
                  {(values: AssigneeOption[]) => (
                    <React.Fragment>
                      {values.map((option) => (
                        <ComboboxChip key={option.id}>
                          {option.label}
                        </ComboboxChip>
                      ))}
                      {values.length === 0 && (
                        <ComboboxChipsInput placeholder="Search members..." />
                      )}
                    </React.Fragment>
                  )}
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxContent anchor={assigneeAnchorRef}>
                {!hasAnyAssigneeResults ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No members match your search
                  </div>
                ) : (
                  <ComboboxList>
                    {filteredHasSkills.length > 0 && (
                      <ComboboxGroup>
                        <ComboboxLabel>Has Required Skills</ComboboxLabel>
                        {filteredHasSkills.map((member) => {
                          const option = assigneeOptionMap.get(member.id)
                          if (!option) return null
                          return (
                            <ComboboxItem key={member.id} value={option}>
                              {getMemberName(member)}
                            </ComboboxItem>
                          )
                        })}
                      </ComboboxGroup>
                    )}

                    {filteredParticipating.length > 0 && (
                      <ComboboxGroup>
                        <ComboboxLabel>Participating</ComboboxLabel>
                        {filteredParticipating.map((member) => {
                          const option = assigneeOptionMap.get(member.id)
                          if (!option) return null
                          return (
                            <ComboboxItem key={member.id} value={option}>
                              {getMemberName(member)}
                            </ComboboxItem>
                          )
                        })}
                      </ComboboxGroup>
                    )}

                    {filteredOthers.length > 0 && (
                      <ComboboxGroup>
                        <ComboboxLabel>Other Members</ComboboxLabel>
                        {filteredOthers.map((member) => {
                          const option = assigneeOptionMap.get(member.id)
                          if (!option) return null
                          return (
                            <ComboboxItem key={member.id} value={option}>
                              {getMemberName(member)}
                            </ComboboxItem>
                          )
                        })}
                      </ComboboxGroup>
                    )}

                    {filteredNotParticipating.length > 0 && (
                      <ComboboxGroup>
                        <ComboboxLabel>Not Participating</ComboboxLabel>
                        {filteredNotParticipating.map((member) => {
                          const option = assigneeOptionMap.get(member.id)
                          if (!option) return null
                          return (
                            <ComboboxItem key={member.id} value={option}>
                              {getMemberName(member)}
                            </ComboboxItem>
                          )
                        })}
                      </ComboboxGroup>
                    )}
                  </ComboboxList>
                )}
              </ComboboxContent>
            </Combobox>
            <input type="hidden" name="assigneeMemberId" value={selectedMemberId ?? ""} />
            {selectedMemberId && !isParticipant(selectedMemberId) && (
              <p className="text-sm text-amber-600">
                Warning: This member is not participating in the event
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Required Skills (optional)</Label>
            {orderedSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No skills available. Add skills to the organization first.
              </p>
            ) : (
              <Combobox
                items={orderedSkills}
                multiple
                value={selectedSkillItems}
                onValueChange={handleSkillChange}
                isItemEqualToValue={(skill, selected) => skill.id === selected.id}
                inputValue={skillSearch}
                onInputValueChange={(value) => setSkillSearch(value)}
                autoHighlight
              >
                <ComboboxChips ref={skillsAnchorRef} className="mb-3">
                  <ComboboxValue>
                    {(values: EventSkill[]) => (
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

                <ComboboxContent anchor={skillsAnchorRef}>
                  {displaySkillList.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No skills match your search
                    </div>
                  ) : (
                    <ComboboxList>
                      {displaySkillList.map((skill) => (
                        <ComboboxItem key={skill.id} value={skill}>
                          <SkillBadge>{skill.name}</SkillBadge>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  )}
                </ComboboxContent>
              </Combobox>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
