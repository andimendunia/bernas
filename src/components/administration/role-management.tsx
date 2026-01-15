"use client"

import * as React from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Role, Permission, deleteRole } from "@/lib/permissions"
import { RoleFormDialog } from "./role-form-dialog"
import { toast } from "sonner"

type RoleManagementProps = {
  roles: Role[]
  permissions: Permission[]
  orgId: string
  onRoleUpdated: () => void
}

export function RoleManagement({
  roles,
  permissions,
  orgId,
  onRoleUpdated,
}: RoleManagementProps) {
  const [formDialogOpen, setFormDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleCreateRole = () => {
    setSelectedRole(null)
    setFormDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setFormDialogOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      await deleteRole(selectedRole.id)
      toast.success('Role deleted successfully')
      onRoleUpdated()
      setDeleteDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="size-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.length === 0 ? (
          <Card className="col-span-2 p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No roles created yet. Create your first role to get started.
            </p>
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{role.name}</h3>
                    {role.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRole(role)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Created {new Date(role.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      <RoleFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        role={selectedRole}
        orgId={orgId}
        permissions={permissions}
        onSuccess={onRoleUpdated}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role &ldquo;
              {selectedRole?.name}&rdquo;? Members with this role will have
              no role assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
