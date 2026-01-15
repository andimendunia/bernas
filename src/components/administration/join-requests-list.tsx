"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import {
  JoinRequest,
  Role,
  approveJoinRequest,
  rejectJoinRequest,
} from "@/lib/permissions"
import { toast } from "sonner"

type JoinRequestsListProps = {
  requests: JoinRequest[]
  roles: Role[]
  onRequestProcessed: () => void
}

export function JoinRequestsList({
  requests,
  roles,
  onRequestProcessed,
}: JoinRequestsListProps) {
  const [selectedRequest, setSelectedRequest] = React.useState<JoinRequest | null>(
    null
  )
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")
  const [rejectionNotes, setRejectionNotes] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleApprove = (request: JoinRequest) => {
    setSelectedRequest(request)
    // Set default role if available
    const defaultRole = roles.find((r) => r.is_default)
    setSelectedRoleId(defaultRole?.id || "")
    setApproveDialogOpen(true)
  }

  const handleReject = (request: JoinRequest) => {
    setSelectedRequest(request)
    setRejectionNotes("")
    setRejectDialogOpen(true)
  }

  const confirmApprove = async () => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      // Convert "no-role" string to null
      const roleIdToAssign = selectedRoleId === "no-role" ? null : selectedRoleId || null
      
      await approveJoinRequest(
        selectedRequest.id,
        roleIdToAssign
      )
      toast.success("Join request approved successfully")
      onRequestProcessed()
      setApproveDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request")
    } finally {
      setLoading(false)
    }
  }

  const confirmReject = async () => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      await rejectJoinRequest(selectedRequest.id, rejectionNotes || null)
      toast.success("Join request rejected")
      onRequestProcessed()
      setRejectDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request")
    } finally {
      setLoading(false)
    }
  }

  const getUserName = (request: JoinRequest) => {
    return (
      request.user.user_metadata.full_name ||
      request.user.user_metadata.name ||
      request.user.email.split("@")[0]
    )
  }

  const getUserInitials = (request: JoinRequest) => {
    const name = getUserName(request)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No pending join requests at the moment.
        </p>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage 
                    src={request.user.user_metadata.avatar_url || request.user.user_metadata.picture}
                    alt={getUserName(request)}
                  />
                  <AvatarFallback className="bg-primary/20">
                    {getUserInitials(request)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{getUserName(request)}</div>
                  <div className="text-sm text-muted-foreground">
                    {request.user.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requested {new Date(request.requested_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(request)}
                >
                  <Check className="size-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(request)}
                >
                  <X className="size-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Join Request</DialogTitle>
            <DialogDescription>
              Approve {selectedRequest && getUserName(selectedRequest)} to join the
              organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Assign role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-role">No role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={loading}>
              {loading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Join Request</DialogTitle>
            <DialogDescription>
              Reject {selectedRequest && getUserName(selectedRequest)}&apos;s request
              to join the organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Reason (optional)</Label>
              <Textarea
                id="notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Add a note about why this request was rejected"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={loading}
              variant="destructive"
            >
              {loading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
