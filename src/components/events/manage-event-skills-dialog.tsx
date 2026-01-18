"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type Skill = {
  id: string
  name: string
}

type ManageEventSkillsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  eventId: string | null
  eventName: string | null
  skills: Skill[]
  requiredSkillIds: string[]
  onSuccess: () => void
}

export function ManageEventSkillsDialog({
  open,
  onOpenChange,
  organizationId,
  eventId,
  eventName,
  skills,
  requiredSkillIds,
  onSuccess,
}: ManageEventSkillsDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([])

  // Initialize selected skills when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedSkills(requiredSkillIds)
    }
  }, [open, requiredSkillIds])

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSave = async () => {
    if (!eventId) return

    setLoading(true)

    // Find skills to add
    const skillsToAdd = selectedSkills.filter(
      (id) => !requiredSkillIds.includes(id)
    )

    // Find skills to remove
    const skillsToRemove = requiredSkillIds.filter(
      (id) => !selectedSkills.includes(id)
    )

    let hasError = false

    // Add new skill links
    if (skillsToAdd.length > 0) {
      const { error: addError } = await supabase
        .from('event_skill_links')
        .insert(
          skillsToAdd.map((skillId) => ({
            org_id: organizationId,
            event_id: eventId,
            skill_id: skillId,
          }))
        )

      if (addError) {
        console.error('Failed to add skills:', addError)
        hasError = true
      }
    }

    // Remove skill links
    if (skillsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('event_skill_links')
        .delete()
        .eq('org_id', organizationId)
        .eq('event_id', eventId)
        .in('skill_id', skillsToRemove)

      if (removeError) {
        console.error('Failed to remove skills:', removeError)
        hasError = true
      }
    }

    setLoading(false)

    if (hasError) {
      toast.error('Some changes failed to save')
    } else if (skillsToAdd.length > 0 || skillsToRemove.length > 0) {
      toast.success('Event skills updated')
      onSuccess()
      onOpenChange(false)
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Required Skills: {eventName}</DialogTitle>
          <DialogDescription>
            Select skills required for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {skills.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No skills available. Create skills first to assign them to events.
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                {selectedSkills.length} of {skills.length} skills selected
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.id)
                  return (
                    <Badge
                      key={skill.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer text-base py-2 px-3"
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.name}
                      {isSelected && <Check className="ml-2 size-4" />}
                    </Badge>
                  )
                })}
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || skills.length === 0}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
