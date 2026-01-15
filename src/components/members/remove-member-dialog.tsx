"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Member, removeMember } from "@/lib/permissions"
import { toast } from "sonner"

type RemoveMemberDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
  onSuccess: () => void
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: RemoveMemberDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const handleRemove = async () => {
    setLoading(true)
    try {
      await removeMember(member.id)
      toast.success('Member removed successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to remove member')
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove member?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{getUserName()}</strong> from
            this organization? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Removing...' : 'Remove member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
