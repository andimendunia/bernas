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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Member, getOrgRoles, assignRole } from "@/lib/permissions"
import { toast } from "sonner"

type MemberRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
  onSuccess: () => void
}

export function MemberRoleDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: MemberRoleDialogProps) {
  const [roles, setRoles] = React.useState<any[]>([])
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(
    member.role_id
  )
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      getOrgRoles(member.org_id).then(setRoles)
    }
  }, [open, member.org_id])

  const handleSave = async () => {
    setLoading(true)
    try {
      await assignRole(member.id, selectedRoleId)
      toast.success('Member role updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update member role')
    } finally {
      setLoading(false)
    }
  }

  const getUserName = () => {
    return (
      member.user.user_metadata.full_name ||
      member.user.user_metadata.name ||
      member.user.email
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change member role</DialogTitle>
          <DialogDescription>
            Update the role for {getUserName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current role</Label>
            <div className="text-sm text-muted-foreground">
              {member.role?.name || 'No role assigned'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">New role</Label>
            <Select
              value={selectedRoleId || 'none'}
              onValueChange={(value) =>
                setSelectedRoleId(value === 'none' ? null : value)
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No role</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                    {role.is_default && ' (Default)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
