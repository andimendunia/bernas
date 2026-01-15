"use client"

import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RoleManagement } from "./role-management"
import { JoinRequestsList } from "./join-requests-list"
import { DeleteOrganizationSection } from "./delete-organization-section"
import { Role, Permission, JoinRequest } from "@/lib/permissions"

type AdministrationTabsProps = {
  roles: Role[]
  permissions: Permission[]
  joinRequests: JoinRequest[]
  orgId: string
  orgName: string
}

export function AdministrationTabs({
  roles,
  permissions,
  joinRequests,
  orgId,
  orgName,
}: AdministrationTabsProps) {
  const router = useRouter()

  const handleUpdated = () => {
    router.refresh()
  }

  const pendingCount = joinRequests.length

  return (
    <Tabs defaultValue="join-requests" className="w-full">
      <TabsList>
        <TabsTrigger value="join-requests" className="gap-2">
          Join Requests
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {pendingCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
      </TabsList>

      <TabsContent value="join-requests" className="mt-4">
        <JoinRequestsList
          requests={joinRequests}
          roles={roles}
          onRequestProcessed={handleUpdated}
        />
      </TabsContent>

      <TabsContent value="roles" className="mt-4">
        <RoleManagement
          roles={roles}
          permissions={permissions}
          orgId={orgId}
          onRoleUpdated={handleUpdated}
        />
      </TabsContent>

      <TabsContent value="danger" className="mt-4">
        <DeleteOrganizationSection
          organization={{ id: orgId, name: orgName }}
        />
      </TabsContent>
    </Tabs>
  )
}
