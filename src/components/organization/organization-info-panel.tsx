"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Copy, Pencil } from "lucide-react"
import { toast } from "sonner"
import { EditOrganizationDialog } from "@/components/organization/edit-organization-dialog"

type OrganizationInfoPanelProps = {
  organization: {
    id: string
    name: string
    join_code: string
    avatar_emoji: string
    avatar_color: string
    created_at: string
  }
  memberCount: number
  canEdit: boolean
  onOrganizationUpdated: () => void
}

export function OrganizationInfoPanel({
  organization,
  memberCount,
  canEdit,
  onOrganizationUpdated,
}: OrganizationInfoPanelProps) {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleCopyJoinCode = () => {
    navigator.clipboard.writeText(organization.join_code)
    toast.success("Join code copied to clipboard")
  }

  return (
    <>
      <div className="w-full max-w-5xl space-y-6">
        <h2 className="sr-only">Organization info</h2>
        
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
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
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

      <EditOrganizationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        organization={organization}
        onSuccess={onOrganizationUpdated}
      />
    </>
  )
}
