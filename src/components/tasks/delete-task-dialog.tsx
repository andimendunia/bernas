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
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

import { deleteTask } from "@/app/[orgSlug]/events/[id]/actions"
import type { EventTask } from "@/components/events/event-detail"

type DeleteTaskDialogProps = {
  task: EventTask
  orgId: string
  onTaskDeleted: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function DeleteTaskDialog({
  task,
  orgId,
  onTaskDeleted,
  trigger,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: DeleteTaskDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = typeof openProp === "boolean"
  const dialogOpen = isControlled ? openProp : internalOpen
  const setDialogOpen = isControlled ? onOpenChange ?? (() => {}) : setInternalOpen
  const [loading, setLoading] = React.useState(false)

  const handleDelete = async () => {
    setLoading(true)

    const formData = new FormData()
    formData.append("taskId", task.id)
    formData.append("orgId", orgId)

    const result = await deleteTask(formData)

    if (result.success) {
      toast.success("Task deleted successfully")
      setDialogOpen(false)
      onTaskDeleted()
    } else {
      toast.error(result.error ?? "Failed to delete task")
    }

    setLoading(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger ?? <Button variant="destructive">Delete Task</Button>}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete task?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the task <strong>{task.title}</strong>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
