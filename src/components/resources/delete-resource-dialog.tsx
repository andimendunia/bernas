"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type DeleteResourceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceId: string | null
  resourceTitle: string | null
  onSuccess: () => void
}

export function DeleteResourceDialog({
  open,
  onOpenChange,
  resourceId,
  resourceTitle,
  onSuccess,
}: DeleteResourceDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const handleDelete = async () => {
    if (!resourceId) return

    setLoading(true)

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId)

    setLoading(false)

    if (error) {
      toast.error('Failed to delete resource')
      console.error(error)
      return
    }

    toast.success('Resource deleted successfully')
    onSuccess()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the resource <strong>{resourceTitle}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Resource"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
