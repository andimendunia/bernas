"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { Member } from "@/lib/permissions"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type Skill = {
  id: string
  name: string
}

type ManageSkillMembersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  skill: Skill | null
  members: Member[]
  memberIdsWithSkill: string[]
  onSuccess: () => void
}

export function ManageSkillMembersDialog({
  open,
  onOpenChange,
  organizationId,
  skill,
  members,
  memberIdsWithSkill,
  onSuccess,
}: ManageSkillMembersDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])

  // Initialize selected members when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedMembers(memberIdsWithSkill)
    }
  }, [open, memberIdsWithSkill])

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

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSave = async () => {
    if (!skill) return

    setLoading(true)

    // Find members to add (in selectedMembers but not in memberIdsWithSkill)
    const membersToAdd = selectedMembers.filter(
      (id) => !memberIdsWithSkill.includes(id)
    )

    // Find members to remove (in memberIdsWithSkill but not in selectedMembers)
    const membersToRemove = memberIdsWithSkill.filter(
      (id) => !selectedMembers.includes(id)
    )

    let hasError = false

    // Add new skill assignments
    if (membersToAdd.length > 0) {
      const { error: addError } = await supabase
        .from('member_skills')
        .insert(
          membersToAdd.map((memberId) => ({
            org_id: organizationId,
            member_id: memberId,
            skill_id: skill.id,
          }))
        )

      if (addError) {
        console.error('Failed to add members:', addError)
        hasError = true
      }
    }

    // Remove skill assignments
    if (membersToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('member_skills')
        .delete()
        .eq('org_id', organizationId)
        .eq('skill_id', skill.id)
        .in('member_id', membersToRemove)

      if (removeError) {
        console.error('Failed to remove members:', removeError)
        hasError = true
      }
    }

    setLoading(false)

    if (hasError) {
      toast.error('Some changes failed to save')
    } else if (membersToAdd.length > 0 || membersToRemove.length > 0) {
      toast.success('Skill assignments updated')
      onSuccess()
      onOpenChange(false)
    } else {
      onOpenChange(false)
    }
  }

  if (!skill) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Skill: {skill.name}</DialogTitle>
          <DialogDescription>
            Assign or remove this skill from members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {selectedMembers.length} of {members.length} members selected
            </div>

            <div className="grid gap-2">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.id)
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleMember(member.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={
                            member.user.user_metadata.avatar_url ||
                            member.user.user_metadata.picture
                          }
                          alt={getUserName(member)}
                        />
                        <AvatarFallback className="bg-primary/20">
                          {getUserInitials(member)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="font-medium">{getUserName(member)}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.user.email}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="size-5 text-primary" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
