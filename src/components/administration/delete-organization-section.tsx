"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type DeleteOrganizationSectionProps = {
  organization: {
    id: string
    name: string
  }
}

export function DeleteOrganizationSection({
  organization,
}: DeleteOrganizationSectionProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [confirmationText, setConfirmationText] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const isConfirmationValid = confirmationText === organization.name

  const handleDelete = async () => {
    if (!isConfirmationValid) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", organization.id)

      if (error) throw error

      // Also update user metadata to remove active org
      await supabase.auth.updateUser({
        data: {
          active_org_id: null,
        },
      })

      toast.success("Organization deleted successfully")
      router.push("/onboarding")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete organization")
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/50 p-6">
        <div className="flex gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently delete this organization and all associated data.
              </p>
            </div>
            <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <p className="font-medium">This action will:</p>
              <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                <li>Delete all events and tasks</li>
                <li>Remove all members from the organization</li>
                <li>Delete all roles and permissions</li>
                <li>Remove all resources and files</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDialogOpen(true)}
            >
              Delete Organization
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              organization and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Type <strong>{organization.name}</strong> to confirm
              </Label>
              <Input
                id="confirm"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={organization.name}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmationText("")
                setDialogOpen(false)
              }}
              disabled={loading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!isConfirmationValid || loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
