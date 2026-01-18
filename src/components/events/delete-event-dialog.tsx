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

type DeleteEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
  eventName: string | null
  onSuccess: () => void
}

export function DeleteEventDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  onSuccess,
}: DeleteEventDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const handleDelete = async () => {
    if (!eventId) return

    setLoading(true)

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    setLoading(false)

    if (error) {
      toast.error('Gagal menghapus acara')
      console.error(error)
      return
    }

    toast.success('Acara berhasil dihapus')
    onSuccess()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Acara?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus acara <strong>{eventName}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Menghapus..." : "Hapus Acara"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
