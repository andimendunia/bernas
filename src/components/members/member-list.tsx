"use client"

import * as React from "react"
import { Search, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Member } from "@/lib/permissions"
import { MemberRoleDialog } from "./member-role-dialog"
import { RemoveMemberDialog } from "./remove-member-dialog"

type MemberListProps = {
  members: Member[]
  canChangeRole: boolean
  canRemove: boolean
  onMemberUpdated: () => void
}

export function MemberList({
  members,
  canChangeRole,
  canRemove,
  onMemberUpdated,
}: MemberListProps) {
  const [search, setSearch] = React.useState("")
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false)

  const filteredMembers = members.filter((member) => {
    const name =
      member.user.user_metadata.full_name ||
      member.user.user_metadata.name ||
      member.user.email
    return name.toLowerCase().includes(search.toLowerCase())
  })

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

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No members found
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50"
              >
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

                <div className="flex items-center gap-3">
                  {member.is_admin ? (
                    <Badge variant="default">Admin</Badge>
                  ) : member.role ? (
                    <Badge variant="secondary">{member.role.name}</Badge>
                  ) : (
                    <Badge variant="outline">No role</Badge>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </div>

                  {(canChangeRole || canRemove) && !member.is_admin && (
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
                  )}
                </div>
              </div>
            ))
          )}
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
    </>
  )
}
