"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "@/components/ui/skill-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog"
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

type TaskTableViewProps = {
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
}

const getAvatarUrl = (member: EventOrgMember | null) => {
  const metadata = member?.users?.user_metadata as Record<string, unknown> | null
  const avatarUrl = metadata?.avatar_url
  const picture = metadata?.picture
  if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) return avatarUrl
  if (typeof picture === "string" && picture.trim().length > 0) return picture
  return undefined
}

const StatusBadge = ({ status }: { status: EventTask["status"] }) => {
  const config = statusConfig[status]
  return <Badge className={config.color}>{config.label}</Badge>
}

export function TaskTableView({
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
}: TaskTableViewProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const columns = React.useMemo<ColumnDef<EventTask>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
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
        id: "assignee",
        header: "Assignee",
        cell: ({ row }) => {
          const task = row.original
          const name = getAssigneeName(task)
          const avatarUrl = getAvatarUrl(task.org_members)
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="bg-primary/20 text-[10px]">
                  {getAssigneeInitials(task)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{name}</span>
            </div>
          )
        },
      },
      {
        id: "skills",
        header: "Skills",
        cell: ({ row }) => {
          const skills = row.original.task_skill_links?.map((link) => link.skills) ?? []
          if (skills.length === 0) return <span className="text-xs text-muted-foreground">—</span>
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
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const task = row.original
          if (!canEditTasks && !canDeleteTasks) return null
          return (
            <div className="flex items-center gap-2">
              {canEditTasks && (
                <EditTaskDialog
                  task={task}
                  eventId={eventId}
                  orgId={orgId}
                  participations={participations}
                  allMembers={allMembers}
                  eventSkills={eventSkills}
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
      canDeleteTasks,
      canEditTasks,
      eventId,
      eventSkills,
      allSkills,
      orgId,
      participations,
      onTasksUpdated,
    ]
  )

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} task
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </div>
      </div>

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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
    </div>
  )
}
