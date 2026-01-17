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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type AddSkillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess: () => void
}

export function AddSkillDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: AddSkillDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setError("")
    }
  }, [open])

  const validateSkillName = (value: string): boolean => {
    // Must be lowercase, no spaces, can have hyphens
    const regex = /^[a-z][a-z0-9-]*$/
    return regex.test(value)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    
    if (value && !validateSkillName(value)) {
      setError("Skill name must be lowercase, no spaces (use hyphens)")
    } else {
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateSkillName(name)) {
      setError("Skill name must be lowercase, no spaces (use hyphens)")
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase
      .from('skills')
      .insert({
        org_id: organizationId,
        name: name.trim(),
        description: description.trim() || null,
      })

    setLoading(false)

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation
        toast.error('A skill with this name already exists')
      } else {
        toast.error('Failed to create skill')
        console.error(insertError)
      }
      return
    }

    toast.success('Skill created successfully')
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Skill</DialogTitle>
          <DialogDescription>
            Add a new skill that members can assign to themselves.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skill-name">
              Skill name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="skill-name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., audio-editing, grant-writing"
              required
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and hyphens only. No spaces.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skill-description">Description (optional)</Label>
            <Textarea
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this skill"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!error}>
              {loading ? "Creating..." : "Create Skill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
