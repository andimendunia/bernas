"use client"

import * as React from "react"
import Link from "next/link"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Filter,
  Plus,
  Search,
  X,
  ExternalLink,
  User,
  Trash2,
  Edit,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog"
import type { EventOrgMember, EventSkill } from "@/components/events/event-detail"
import type { EventParticipation } from "@/components/tasks/task-types"
import { formatDeadline, getMemberName, statusConfig } from "@/components/tasks/task-utils"

export type TaskWithEvent = {
  id: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "done"
  deadline: string | null
  event_id: string | null
  assignee_member_id: string | null
  created_at: string
  updated_at: string
  events: { id: string; name: string } | null
  org_members: EventOrgMember | null
  task_skill_links?: Array<{ skill_id: string; skills: EventSkill }>
}

type EventSummary = {
  id: string
  name: string
}

export type AllTasksProps = {
  orgId: string
  orgSlug: string
  tasks: TaskWithEvent[]
  events: EventSummary[]
  allMembers: EventOrgMember[]
  allSkills: EventSkill[]
  eventSkillsByEvent: Record<string, EventSkill[]>
  participationsByEvent: Record<string, EventParticipation[]>
  canCreateTasks: boolean
  canEditTasks: boolean
  canDeleteTasks: boolean
  defaultAssigneeId?: string | null
  onTasksUpdated: () => void
}

const getAvatarUrl = (member: EventOrgMember | null) => {
  const metadata = member?.users?.user_metadata as Record<string, unknown> | null
  const avatarUrl = metadata?.avatar_url
  const picture = metadata?.picture
  if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) return avatarUrl
  if (typeof picture === "string" && picture.trim().length > 0) return picture
  return undefined
}

const getTaskSkillIds = (task: TaskWithEvent) =>
  task.task_skill_links?.map((link) => link.skill_id) ?? []

const getTaskSkills = (task: TaskWithEvent) =>
  task.task_skill_links?.map((link) => link.skills) ?? []

const StatusBadge = ({ status }: { status: TaskWithEvent["status"] }) => {
  const config = statusConfig[status]
  return <Badge className={config.color}>{config.label}</Badge>
}

export function AllTasks({
  orgId,
  orgSlug,
  tasks,
  events,
  allMembers,
  allSkills,
  eventSkillsByEvent,
  participationsByEvent,
  canCreateTasks,
  canEditTasks,
  canDeleteTasks,
  defaultAssigneeId,
  onTasksUpdated,
}: AllTasksProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [eventFilter, setEventFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | TaskWithEvent["status"]
  >("all")
  const [assigneeFilter, setAssigneeFilter] = React.useState(
    defaultAssigneeId ?? "all"
  )
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [createEventId, setCreateEventId] = React.useState<string>("")

  React.useEffect(() => {
    if (!createEventId && events.length > 0) {
      setCreateEventId(events[0].id)
    }
  }, [createEventId, events])

  React.useEffect(() => {
    if (eventFilter !== "all") {
      setCreateEventId(eventFilter)
    }
  }, [eventFilter])

  const filteredTasks = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return tasks.filter((task) => {
      if (query) {
        const titleMatch = task.title.toLowerCase().includes(query)
        const descriptionMatch = task.description?.toLowerCase().includes(query)
        if (!titleMatch && !descriptionMatch) return false
      }

      if (eventFilter !== "all") {
        if (task.event_id !== eventFilter) return false
      }

      if (statusFilter !== "all" && task.status !== statusFilter) return false

      if (assigneeFilter !== "all") {
        if (assigneeFilter === "unassigned") {
          if (task.assignee_member_id !== null) return false
        } else if (task.assignee_member_id !== assigneeFilter) {
          return false
        }
      }

      if (selectedSkills.length > 0) {
        const taskSkillIds = getTaskSkillIds(task)
        if (!selectedSkills.some((skillId) => taskSkillIds.includes(skillId))) {
          return false
        }
      }

      return true
    })
  }, [tasks, searchQuery, eventFilter, statusFilter, assigneeFilter, selectedSkills])

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    eventFilter !== "all" ||
    statusFilter !== "all" ||
    assigneeFilter !== "all" ||
    selectedSkills.length > 0

  const clearFilters = () => {
    setSearchQuery("")
    setEventFilter("all")
    setStatusFilter("all")
    setAssigneeFilter(defaultAssigneeId ?? "all")
    setSelectedSkills([])
  }

  const memberOptions = React.useMemo(
    () =>
      allMembers.map((member) => ({
        id: member.id,
        label: getMemberName(member),
      })),
    [allMembers]
  )

  const eventOptions = React.useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        name: event.name,
      })),
    [events]
  )

  const columns = React.useMemo<ColumnDef<TaskWithEvent>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Task
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.title}</div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "event",
        accessorFn: (row) => row.events?.name ?? "",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Event
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const event = row.original.events
          if (!event) return <span className="text-xs text-muted-foreground">No event</span>
          return (
            <Link
              href={`/${orgSlug}/events/${event.id}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {event.name}
              <ExternalLink className="size-3" />
            </Link>
          )
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "assignee",
        accessorFn: (row) => getMemberName(row.org_members),
        header: "Assignee",
        cell: ({ row }) => {
          const member = row.original.org_members
          const name = getMemberName(member)
          const avatarUrl = getAvatarUrl(member)
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="bg-primary/20 text-[10px]">
                  <User className="size-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{name}</span>
            </div>
          )
        },
      },
      {
        id: "skills",
        accessorFn: (row) => getTaskSkills(row).map((skill) => skill.name).join(", "),
        header: "Skills",
        cell: ({ row }) => {
          const skills = getTaskSkills(row.original)
          if (skills.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <SkillBadge key={skill.id}>{skill.name}</SkillBadge>
              ))}
            </div>
          )
        },
      },
      {
        accessorKey: "deadline",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Deadline
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const deadline = formatDeadline(row.original.deadline)
          return deadline ? <span>{deadline}</span> : <span>—</span>
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (!canEditTasks && !canDeleteTasks) return null
          const task = row.original
          const eventId = task.event_id ?? ""
          return (
            <div className="flex items-center gap-2">
              {canEditTasks && (
                <EditTaskDialog
                  task={task}
                  eventId={eventId}
                  orgId={orgId}
                  participations={participationsByEvent[eventId] ?? []}
                  allMembers={allMembers}
                  eventSkills={eventSkillsByEvent[eventId] ?? []}
                  allSkills={allSkills}
                  onTaskUpdated={onTasksUpdated}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Edit className="size-4" />
                    </Button>
                  }
                />
              )}
              {canDeleteTasks && (
                <DeleteTaskDialog
                  task={task}
                  orgId={orgId}
                  onTaskDeleted={onTasksUpdated}
                  trigger={
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
              )}
            </div>
          )
        },
      },
    ],
    [
      allMembers,
      allSkills,
      canDeleteTasks,
      canEditTasks,
      eventSkillsByEvent,
      orgSlug,
      orgId,
      onTasksUpdated,
      participationsByEvent,
    ]
  )

  const table = useReactTable({
    data: filteredTasks,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  const createEventValue = createEventId || "no-event"

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {eventOptions.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | TaskWithEvent["status"])}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(statusConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
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
              {memberOptions.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="size-4" />
                {selectedSkills.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {selectedSkills.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by skills</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allSkills.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No skills available
                </div>
              ) : (
                allSkills.map((skill) => (
                  <DropdownMenuCheckboxItem
                    key={skill.id}
                    checked={selectedSkills.includes(skill.id)}
                    onCheckedChange={() =>
                      setSelectedSkills((prev) =>
                        prev.includes(skill.id)
                          ? prev.filter((id) => id !== skill.id)
                          : [...prev, skill.id]
                      )
                    }
                  >
                    {skill.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 size-4" />
              Clear
            </Button>
          )}
        </div>

        {canCreateTasks && (
          <div className="flex flex-col gap-2 md:items-end">
            <Select
              value={createEventValue}
              onValueChange={(value) =>
                setCreateEventId(value === "no-event" ? "" : value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Create for event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-event">No event</SelectItem>
                {eventOptions.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AddTaskDialog
              eventId={createEventId}
              orgId={orgId}
              participations={participationsByEvent[createEventId] ?? []}
              allMembers={allMembers}
              eventSkills={eventSkillsByEvent[createEventId] ?? []}
              allSkills={allSkills}
              onTaskAdded={onTasksUpdated}
              trigger={
                <Button>
                  <Plus className="mr-2 size-4" />
                  Add Task
                </Button>
              }
            />
          </div>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No tasks found.</p>
          {canCreateTasks && (
            <p className="mt-2 text-xs text-muted-foreground">
              Create a task to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredTasks.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {tasks.length} task
          {tasks.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}
