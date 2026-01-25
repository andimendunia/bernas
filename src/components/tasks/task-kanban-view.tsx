"use client"

import * as React from "react"
import { Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

type TaskKanbanViewProps = {
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

const StatusBadge = ({ status }: { status: EventTask["status"] }) => {
  const config = statusConfig[status]
  return <Badge className={config.color}>{config.label}</Badge>
}

const STATUS_OPTIONS: Array<{ value: EventTask["status"]; label: string }> = [
  { value: "todo", label: statusConfig.todo.label },
  { value: "in_progress", label: statusConfig.in_progress.label },
  { value: "done", label: statusConfig.done.label },
]

export function TaskKanbanView({
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
}: TaskKanbanViewProps) {
  const [openEditTaskId, setOpenEditTaskId] = React.useState<string | null>(null)
  const [openDeleteTaskId, setOpenDeleteTaskId] = React.useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = React.useState<string | null>(null)

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
  const columns = React.useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === "todo"),
      in_progress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done"),
    }
  }, [tasks])

  const columnEntries: Array<{ key: EventTask["status"]; label: string }> = [
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "done", label: "Done" },
  ]

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
      {columnEntries.map((column) => {
        const columnTasks = columns[column.key]
        return (
          <div key={column.key} className="rounded-lg bg-muted/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{column.label}</h3>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              {columnTasks.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No tasks
                </div>
              ) : (
                columnTasks.map((task) => {
                  const deadline = formatDeadline(task.deadline)
                  const skills = task.task_skill_links?.map((link) => link.skills) ?? []
                  const assigneeName = getAssigneeName(task)
                  const avatarUrl = getAvatarUrl(task.org_members)
                  const showAssignToMe =
                    canEditTasks &&
                    currentMemberId &&
                    task.assignee_member_id !== currentMemberId

                  return (
                    <div key={task.id} className="rounded-lg border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">{task.title}</div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
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

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                            <Calendar className="size-3" />
                            <span>Due {deadline}</span>
                          </div>
                        )}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
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
          </div>
        )
      })}
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
    </>
  )
}
