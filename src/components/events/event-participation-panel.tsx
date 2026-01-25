"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type ParticipationStatus = "full" | "partial" | "declined"

type EventParticipationPanelProps = {
  orgId: string
  eventId: string
  participations: Array<{ member_id: string; status: ParticipationStatus | null }>
  allMembers: Array<{ id: string; user_id: string }>
  onUpdated: () => void
  showHeader?: boolean
  className?: string
}

const STATUS_LABELS: Record<ParticipationStatus, string> = {
  full: "Participating",
  partial: "Partial",
  declined: "Not participating",
}

export function EventParticipationPanel({
  orgId,
  eventId,
  participations,
  allMembers,
  onUpdated,
  showHeader = true,
  className,
}: EventParticipationPanelProps) {
  const [saving, setSaving] = React.useState(false)
  const [currentStatus, setCurrentStatus] = React.useState<
    ParticipationStatus | null
  >(null)
  const [memberId, setMemberId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      const userId = data.user?.id
      if (!userId) return
      const member = allMembers.find((item) => item.user_id === userId)
      setMemberId(member?.id ?? null)
    })
    return () => {
      mounted = false
    }
  }, [allMembers])

  React.useEffect(() => {
    if (!memberId) {
      setCurrentStatus(null)
      return
    }
    const existing = participations.find(
      (participation) => participation.member_id === memberId
    )
    setCurrentStatus(existing?.status ?? null)
  }, [participations, memberId])

  const handleStatusChange = async (nextStatus: ParticipationStatus) => {
    if (!memberId) {
      toast.error("You are not a member of this organization.")
      return
    }

    if (nextStatus === currentStatus) return

    setSaving(true)

    const { error } = await supabase
      .from("event_participations")
      .upsert(
        {
          org_id: orgId,
          event_id: eventId,
          member_id: memberId,
          status: nextStatus,
        },
        { onConflict: "event_id,member_id" }
      )

    if (error) {
      console.error("Failed to update participation", error)
      toast.error(error.message ?? "Failed to update participation")
      setSaving(false)
      return
    }

    setCurrentStatus(nextStatus)
    toast.success("Participation updated")
    onUpdated()
    setSaving(false)
  }

  return (
    <div
      className={cn(
        "space-y-4",
        showHeader && "rounded-lg border p-4",
        className
      )}
    >
      {showHeader && (
        <div>
          <div className="text-sm font-medium">Your participation</div>
          <p className="text-xs text-muted-foreground">
            Let the organizers know your participation status.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(Object.keys(STATUS_LABELS) as ParticipationStatus[]).map((status) => {
          const isSelected = currentStatus === status
          return (
            <Button
              key={status}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => handleStatusChange(status)}
              disabled={saving}
            >
              {STATUS_LABELS[status]}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
