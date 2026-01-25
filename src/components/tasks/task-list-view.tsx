"use client"

import * as React from "react"
import { Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog"
import { updateTask } from "@/app/[orgSlug]/events/[id]/actions"
import type {
  EventOrgMember,
  EventSkill,
  EventTask,
} from "@/components/events/event-detail"
import type { EventParticipation } from "@/components/tasks/task-types"
import {
  formatDeadline,
  getAssigneeInitials,
  getAssigneeName,
  getMemberName,
  statusConfig,
} from "@/components/tasks/task-utils"

const getAvatarUrl = (member: EventOrgMember | null) => {
  const metadata = member?.users?.user_metadata as Record<string, unknown> | null
  const avatarUrl = metadata?.avatar_url
  const picture = metadata?.picture
  if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) return avatarUrl
  if (typeof picture === "string" && picture.trim().length > 0) return picture
  return undefined
}

type TaskListViewProps = {
  eventId: string
  orgId: string
  tasks: EventTask[]
  participations: EventParticipation[]
  allMembers: EventOrgMember[]
  eventSkills: EventSkill[]
  allSkills: EventSkill[]
  canEditTasks: boolean
  canDeleteTasks: boolean
  onTasksUpdated: () => void
  currentUserId: string | null
}

type DeadlineSort = "none" | "asc" | "desc"

const getDeadlineTime = (deadline: string | null) => {
  if (!deadline) return null
  const time = new Date(deadline).getTime()
  return Number.isNaN(time) ? null : time
}

const StatusBadge = ({ status }: { status: EventTask["status"] }) => {
  const config = statusConfig[status]
  return <Badge className={config.color}>{config.label}</Badge>
}

const STATUS_OPTIONS: Array<{ value: EventTask["status"]; label: string }> = [
  { value: "todo", label: statusConfig.todo.label },
  { value: "in_progress", label: statusConfig.in_progress.label },
  { value: "done", label: statusConfig.done.label },
]

export function TaskListView({
  eventId,
  orgId,
  tasks,
  participations,
  allMembers,
  eventSkills,
  allSkills,
  canEditTasks,
  canDeleteTasks,
  onTasksUpdated,
  currentUserId,
}: TaskListViewProps) {
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | EventTask["status"]
  >("all")
  const [assigneeFilter, setAssigneeFilter] = React.useState("all")
  const [deadlineSort, setDeadlineSort] = React.useState<DeadlineSort>("none")
  const [openEditTaskId, setOpenEditTaskId] = React.useState<string | null>(null)
  const [openDeleteTaskId, setOpenDeleteTaskId] = React.useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = React.useState<string | null>(null)

  const assigneeOptions = React.useMemo(
    () =>
      allMembers.map((member) => ({
        id: member.id,
        label: getMemberName(member),
      })),
    [allMembers]
  )

  const currentMemberId = React.useMemo(() => {
    if (!currentUserId) return null
    const member = allMembers.find((item) => item.user_id === currentUserId)
    return member?.id ?? null
  }, [allMembers, currentUserId])

  const updateTaskFromMenu = async (
    task: EventTask,
    overrides: { status?: EventTask["status"]; assigneeMemberId?: string | null }
  ) => {
    setUpdatingTaskId(task.id)

    const formData = new FormData()
    formData.append("orgId", orgId)
    formData.append("eventId", eventId)
    formData.append("taskId", task.id)
    formData.set("title", task.title)
    formData.set("description", task.description ?? "")
    formData.set("status", overrides.status ?? task.status)
    formData.set(
      "assigneeMemberId",
      overrides.assigneeMemberId ?? task.assignee_member_id ?? ""
    )
    formData.append("deadline", task.deadline ?? "")
    const skillIds = task.task_skill_links
      ?.map((link) => link.skill_id)
      .filter((id): id is string => Boolean(id))
    formData.append("skillIds", JSON.stringify(skillIds ?? []))

    const result = await updateTask(formData)
    if (result.success) {
      onTasksUpdated()
    }
    setUpdatingTaskId(null)
  }

  const filteredTasks = React.useMemo(() => {
    let result = tasks

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter)
    }

    if (assigneeFilter !== "all") {
      result = result.filter((task) => {
        if (assigneeFilter === "unassigned") {
          return task.assignee_member_id === null
        }
        return task.assignee_member_id === assigneeFilter
      })
    }

    if (deadlineSort !== "none") {
      const multiplier = deadlineSort === "asc" ? 1 : -1
      result = [...result].sort((a, b) => {
        const aTime = getDeadlineTime(a.deadline)
        const bTime = getDeadlineTime(b.deadline)
        if (aTime === null && bTime === null) return 0
        if (aTime === null) return 1
        if (bTime === null) return -1
        return (aTime - bTime) * multiplier
      })
    }

    return result
  }, [tasks, statusFilter, assigneeFilter, deadlineSort])

  const hasActiveFilters =
    statusFilter !== "all" || assigneeFilter !== "all" || deadlineSort !== "none"

  const clearFilters = () => {
    setStatusFilter("all")
    setAssigneeFilter("all")
    setDeadlineSort("none")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "all" | EventTask["status"])}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assigneeOptions.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={deadlineSort}
            onValueChange={(value) => setDeadlineSort(value as DeadlineSort)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Deadline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No deadline sort</SelectItem>
              <SelectItem value="asc">Soonest first</SelectItem>
              <SelectItem value="desc">Latest first</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No tasks match your filters.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const deadline = formatDeadline(task.deadline)
            const skills = task.task_skill_links?.map((link) => link.skills) ?? []
            const assigneeName = getAssigneeName(task)
            const avatarUrl = getAvatarUrl(task.org_members)
            const showAssignToMe =
              canEditTasks &&
              currentMemberId &&
              task.assignee_member_id !== currentMemberId

            return (
              <div key={task.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {(canEditTasks || canDeleteTasks) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Task options">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {canEditTasks && (
                          <>
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Status</DropdownMenuLabel>
                              {STATUS_OPTIONS.map((option) => (
                                <DropdownMenuCheckboxItem
                                  key={option.value}
                                  checked={task.status === option.value}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      updateTaskFromMenu(task, { status: option.value })
                                    }
                                  }}
                                  disabled={updatingTaskId === task.id}
                                >
                                  {option.label}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {showAssignToMe && (
                          <DropdownMenuItem
                            onSelect={() =>
                              updateTaskFromMenu(task, { assigneeMemberId: currentMemberId })
                            }
                            disabled={updatingTaskId === task.id}
                          >
                            <span className="inline-flex size-4" aria-hidden="true" />
                            Assign to me
                          </DropdownMenuItem>
                        )}
                        {canEditTasks && (
                          <DropdownMenuItem onSelect={() => setOpenEditTaskId(task.id)}>
                            <Pencil className="size-4 text-current" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDeleteTasks && (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setOpenDeleteTaskId(task.id)}
                          >
                            <Trash2 className="size-4 text-current" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <StatusBadge status={task.status} />
                  {task.assignee_member_id ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarImage src={avatarUrl} alt={assigneeName} />
                        <AvatarFallback className="bg-primary/20 text-[10px]">
                          {getAssigneeInitials(task)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assigneeName}</span>
                    </div>
                  ) : (
                    <span>Unassigned</span>
                  )}
                  {deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      <span>Due {deadline}</span>
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {skills.map((skill) => (
                        <SkillBadge key={skill.id}>{skill.name}</SkillBadge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {openEditTaskId && (
        <EditTaskDialog
          task={tasks.find((task) => task.id === openEditTaskId) as EventTask}
          eventId={eventId}
          orgId={orgId}
          participations={participations}
          allMembers={allMembers}
          eventSkills={eventSkills}
          allSkills={allSkills}
          onTaskUpdated={onTasksUpdated}
          open={true}
          onOpenChange={(open) => {
            if (!open) setOpenEditTaskId(null)
          }}
          hideTrigger
        />
      )}
      {openDeleteTaskId && (
        <DeleteTaskDialog
          task={tasks.find((task) => task.id === openDeleteTaskId) as EventTask}
          orgId={orgId}
          onTaskDeleted={onTasksUpdated}
          open={true}
          onOpenChange={(open) => {
            if (!open) setOpenDeleteTaskId(null)
          }}
          hideTrigger
        />
      )}
    </div>
  )
}
