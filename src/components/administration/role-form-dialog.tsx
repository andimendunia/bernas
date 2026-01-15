"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import {
  Role,
  Permission,
  createRole,
  updateRole,
  getRoleWithPermissions,
} from "@/lib/permissions"
import { toast } from "sonner"

type RoleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  orgId: string
  permissions: Permission[]
  onSuccess: () => void
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  orgId,
  permissions,
  onSuccess,
}: RoleFormDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(
    new Set()
  )
  const [loading, setLoading] = React.useState(false)

  // Group permissions by category
  const permissionsByCategory = React.useMemo(() => {
    const grouped: Record<string, Permission[]> = {}
    permissions.forEach((permission) => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = []
      }
      grouped[permission.category].push(permission)
    })
    return grouped
  }, [permissions])

  // Load role data when editing
  React.useEffect(() => {
    if (open && role) {
      setName(role.name)
      setDescription(role.description || "")
      setIsDefault(role.is_default)
      // Load permissions for this role
      getRoleWithPermissions(role.id).then((data) => {
        if (data) {
          setSelectedPermissions(
            new Set(data.permissions.map((p) => p.id))
          )
        }
      })
    } else if (open && !role) {
      // Reset form for new role
      setName("")
      setDescription("")
      setIsDefault(false)
      setSelectedPermissions(new Set())
    }
  }, [open, role])

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId)
      } else {
        newSet.add(permissionId)
      }
      return newSet
    })
  }

  const toggleCategoryPermissions = (category: string, select: boolean) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev)
      permissionsByCategory[category].forEach((permission) => {
        if (select) {
          newSet.add(permission.id)
        } else {
          newSet.delete(permission.id)
        }
      })
      return newSet
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const permissionIds = Array.from(selectedPermissions)

      if (role) {
        await updateRole(role.id, name, description, permissionIds, isDefault)
        toast.success("Role updated successfully")
      } else {
        await createRole(orgId, name, description, permissionIds, isDefault)
        toast.success("Role created successfully")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save role")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Update role name, description, and permissions"
              : "Create a new role with specific permissions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Coordinator, Volunteer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-default"
                checked={isDefault}
                onCheckedChange={(checked) =>
                  setIsDefault(checked === true)
                }
              />
              <Label
                htmlFor="is-default"
                className="text-sm font-normal cursor-pointer"
              >
                Set as default role for new members
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="rounded-md border">
              {Object.entries(permissionsByCategory).map(
                ([category, perms]) => {
                  const allSelected = perms.every((p) =>
                    selectedPermissions.has(p.id)
                  )
                  const someSelected = perms.some((p) =>
                    selectedPermissions.has(p.id)
                  )

                  return (
                    <Collapsible key={category} defaultOpen>
                      <CollapsibleTrigger className="flex w-full items-center justify-between border-b p-4 text-left hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="font-medium capitalize">
                            {category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({perms.filter((p) => selectedPermissions.has(p.id)).length}/
                            {perms.length})
                          </span>
                        </div>
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4">
                        <div className="mb-3 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCategoryPermissions(category, true)}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCategoryPermissions(category, false)}
                          >
                            Deselect All
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {perms.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-start space-x-3"
                            >
                              <Checkbox
                                id={permission.id}
                                checked={selectedPermissions.has(permission.id)}
                                onCheckedChange={() =>
                                  togglePermission(permission.id)
                                }
                              />
                              <div className="grid gap-1">
                                <Label
                                  htmlFor={permission.id}
                                  className="font-normal cursor-pointer"
                                >
                                  {permission.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                }
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : role ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
