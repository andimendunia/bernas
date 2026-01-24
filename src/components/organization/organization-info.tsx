"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Copy, Pencil, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Member } from "@/lib/permissions"
import { MemberRoleDialog } from "@/components/members/member-role-dialog"
import { RemoveMemberDialog } from "@/components/members/remove-member-dialog"
import { EditOrganizationDialog } from "@/components/organization/edit-organization-dialog"

type MemberSkill = {
  member_id: string
  skill_id: string
  skill: {
    id: string
    name: string
    description: string | null
    color: string | null
  }
}

type OrganizationInfoProps = {
  organization: {
    id: string
    name: string
    join_code: string
    avatar_emoji: string
    avatar_color: string
    created_at: string
  }
  canEdit: boolean
  members: Member[]
  memberSkills: MemberSkill[]
  canChangeRole: boolean
  canRemove: boolean
  onMemberUpdated: () => void
  onOrganizationUpdated: () => void
}

export function OrganizationInfo({
  organization,
  canEdit,
  members,
  memberSkills,
  canChangeRole,
  canRemove,
  onMemberUpdated,
  onOrganizationUpdated,
}: OrganizationInfoProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleCopyJoinCode = () => {
    navigator.clipboard.writeText(organization.join_code)
    toast.success("Join code copied to clipboard")
  }

  const getUserName = (member: Member) => {
    return (
      member.user.user_metadata.full_name ||
      member.user.user_metadata.name ||
      member.user.email.split('@')[0]
    )
  }

  const getUserInitials = (member: Member) => {
    const name = getUserName(member)
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleChangeRole = (member: Member) => {
    setSelectedMember(member)
    setRoleDialogOpen(true)
  }

  const handleRemove = (member: Member) => {
    setSelectedMember(member)
    setRemoveDialogOpen(true)
  }

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "user",
      header: "Member",
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage 
                src={member.user.user_metadata.avatar_url || member.user.user_metadata.picture}
                alt={getUserName(member)}
              />
              <AvatarFallback className="bg-primary/20">
                {getUserInitials(member)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{getUserName(member)}</div>
              <div className="text-sm text-muted-foreground">
                {member.user.email}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const member = row.original
        if (member.is_admin) {
          return <Badge variant="default">Admin</Badge>
        }
        if (member.role) {
          return <Badge variant="secondary">{member.role.name}</Badge>
        }
        return <Badge variant="outline">No role</Badge>
      },
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => {
        const member = row.original
        const skills = memberSkills
          .filter((ms) => ms.member_id === member.id)
          .map((ms) => ms.skill)
        const remainingSkills = skills.slice(3)
        
        if (skills.length === 0) {
          return <span className="text-sm text-muted-foreground">—</span>
        }

        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill) => (
              <Badge key={skill.id} variant="outline" className="text-xs">
                {skill.name}
              </Badge>
            ))}
            {remainingSkills.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    +{remainingSkills.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="text-xs">
                    {remainingSkills.map((skill) => skill.name).join(", ")}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString()}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original
        if (member.is_admin) return null
        if (!canChangeRole && !canRemove) return null

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChangeRole && (
                <DropdownMenuItem onClick={() => handleChangeRole(member)}>
                  Change role
                </DropdownMenuItem>
              )}
              {canRemove && (
                <DropdownMenuItem
                  onClick={() => handleRemove(member)}
                  className="text-destructive"
                >
                  Remove member
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <>
      <div className="w-full max-w-5xl space-y-8">
        {/* Organization Info Section */}
        <div>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex size-20 items-center justify-center rounded-2xl text-4xl"
                style={{ backgroundColor: organization.avatar_color }}
              >
                {organization.avatar_emoji}
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{organization.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="size-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Join Code
              </label>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                  {organization.join_code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyJoinCode}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Share this code with people you want to join your organization
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="mt-1 text-sm">
                {new Date(organization.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Members</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Filter members..."
                value={(table.getColumn("user")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("user")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} member{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
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
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {selectedMember && (
        <>
          <MemberRoleDialog
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
            member={selectedMember}
            onSuccess={onMemberUpdated}
          />
          <RemoveMemberDialog
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            member={selectedMember}
            onSuccess={onMemberUpdated}
          />
        </>
      )}

      <EditOrganizationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        organization={organization}
        onSuccess={onOrganizationUpdated}
      />
    </>
  )
}
