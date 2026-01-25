"use client"

import * as React from "react"
import { ChevronsUpDown, Columns, List, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"
import { TaskListView } from "@/components/tasks/task-list-view"
import { TaskKanbanView } from "@/components/tasks/task-kanban-view"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { createTask } from "@/app/[orgSlug]/events/[id]/actions"
import type {
  EventOrgMember,
  EventSkill,
  EventTask,
} from "@/components/events/event-detail"
import type { EventParticipation } from "@/components/tasks/task-types"

type EventTasksSectionProps = {
  eventId: string
  orgId: string
  orgSlug: string
  tasks: EventTask[]
  participations: EventParticipation[]
  allMembers: EventOrgMember[]
  eventSkills: EventSkill[]
  allSkills: EventSkill[]
  canCreateTasks: boolean
  canEditTasks: boolean
  canDeleteTasks: boolean
  onTasksUpdated: () => void
  currentUserId: string | null
}

type TaskView = "list" | "kanban"

export function EventTasksSection({
  eventId,
  orgId,
  orgSlug,
  tasks,
  participations,
  allMembers,
  eventSkills,
  allSkills,
  canCreateTasks,
  canEditTasks,
  canDeleteTasks,
  onTasksUpdated,
  currentUserId,
}: EventTasksSectionProps) {
  const [currentView, setCurrentView] = React.useState<TaskView>("list")
  const [showQuickAdd, setShowQuickAdd] = React.useState(false)
  const [quickTitle, setQuickTitle] = React.useState("")
  const [assignToMe, setAssignToMe] = React.useState(false)
  const [quickLoading, setQuickLoading] = React.useState(false)
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const quickTitleRef = React.useRef<HTMLInputElement>(null)

  const currentMemberId = React.useMemo(() => {
    if (!currentUserId) return null
    const member = allMembers.find((item) => item.user_id === currentUserId)
    return member?.id ?? null
  }, [allMembers, currentUserId])

  const handleQuickAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = quickTitle.trim()
    if (!trimmed) return

    setQuickLoading(true)

    const formData = new FormData()
    formData.append("orgId", orgId)
    formData.append("eventId", eventId)
    formData.set("title", trimmed)
    formData.set("status", "todo")
    formData.set("assigneeMemberId", assignToMe && currentMemberId ? currentMemberId : "")
    formData.append("deadline", "")
    formData.append("skillIds", JSON.stringify([]))

    const result = await createTask(formData)

    if (result.success) {
      toast.success("Task created")
      setQuickTitle("")
      setAssignToMe(false)
      onTasksUpdated()
    } else {
      toast.error(result.error ?? "Failed to create task")
    }

    setQuickLoading(false)
  }

  React.useEffect(() => {
    if (!showQuickAdd) return
    const timeout = setTimeout(() => {
      quickTitleRef.current?.focus()
    }, 0)
    return () => clearTimeout(timeout)
  }, [showQuickAdd])

  return (
    <section className="w-full space-y-4" data-org-slug={orgSlug}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            value={currentView}
            onValueChange={(value) => {
              if (value) setCurrentView(value as TaskView)
            }}
            className="flex items-center gap-0"
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <Columns className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {canCreateTasks && (
            <ButtonGroup>
              <Button variant="outline" onClick={() => setShowQuickAdd((prev) => !prev)}>
                Add Task
                <ChevronsUpDown className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More options">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      setAdvancedOpen(true)
                    }}
                  >
                    Add Task Advanced
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          )}
        </div>
      </div>

      {canCreateTasks && showQuickAdd && (
        <form
          onSubmit={handleQuickAdd}
          className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-center"
        >
          <Input
            ref={quickTitleRef}
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder="Quick task title"
            className="flex-1"
          />
          <div className="flex items-center gap-2 md:shrink-0">
            <Checkbox
              id="quick-assign"
              checked={assignToMe}
              onCheckedChange={(checked) => setAssignToMe(checked === true)}
              disabled={!currentMemberId}
            />
            <label htmlFor="quick-assign" className="text-sm text-muted-foreground">
              Assign to me
            </label>
          </div>
          <div className="flex items-center gap-2 md:shrink-0">
            <Button type="submit" disabled={quickLoading || quickTitle.trim().length === 0}>
              {quickLoading ? "Adding..." : "Add"}
            </Button>
          </div>
          {!currentMemberId && (
            <p className="text-xs text-muted-foreground md:ml-auto">
              You are not a member of this org.
            </p>
          )}
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No tasks yet.</p>
          {canCreateTasks && (
            <p className="text-sm">Create your first task to get started.</p>
          )}
        </div>
      ) : (
        <div className="w-full">
          {currentView === "list" && (
            <TaskListView
              eventId={eventId}
              orgId={orgId}
              tasks={tasks}
              participations={participations}
              allMembers={allMembers}
              eventSkills={eventSkills}
              allSkills={allSkills}
              canEditTasks={canEditTasks}
              canDeleteTasks={canDeleteTasks}
              onTasksUpdated={onTasksUpdated}
              currentUserId={currentUserId}
            />
          )}
          {currentView === "kanban" && (
            <TaskKanbanView
              eventId={eventId}
              orgId={orgId}
              tasks={tasks}
              participations={participations}
              allMembers={allMembers}
              eventSkills={eventSkills}
              allSkills={allSkills}
              canEditTasks={canEditTasks}
              canDeleteTasks={canDeleteTasks}
              onTasksUpdated={onTasksUpdated}
              currentUserId={currentUserId}
            />
          )}
        </div>
      )}

      <AddTaskDialog
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        eventId={eventId}
        orgId={orgId}
        participations={participations}
        allMembers={allMembers}
        eventSkills={eventSkills}
        allSkills={allSkills}
        onTaskAdded={onTasksUpdated}
        hideTrigger
      />
    </section>
  )
}
