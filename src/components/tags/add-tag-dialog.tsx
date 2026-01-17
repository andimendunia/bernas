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
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type AddTagDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess: () => void
}

const colorOptions = [
  "#f2b5b5", "#f0c6a4", "#f4dfb6", "#cfe5c1",
  "#bfd6ea", "#d2c8e8", "#e6c1d9", "#c9d2d6",
]

export function AddTagDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: AddTagDialogProps) {
  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState(colorOptions[0])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setName("")
      setColor(colorOptions[0])
      setError("")
    }
  }, [open])

  const validateTagName = (value: string): boolean => {
    // Must be UPPERCASE, no spaces, can have hyphens
    const regex = /^[A-Z][A-Z0-9-]*$/
    return regex.test(value)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    
    if (value && !validateTagName(value)) {
      setError("Tag name must be UPPERCASE, no spaces (use hyphens)")
    } else {
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateTagName(name)) {
      setError("Tag name must be UPPERCASE, no spaces (use hyphens)")
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase
      .from('event_tags')
      .insert({
        org_id: organizationId,
        name: name.trim(),
        color: color,
      })

    setLoading(false)

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation
        toast.error('A tag with this name already exists')
      } else {
        toast.error('Failed to create tag')
        console.error(insertError)
      }
      return
    }

    toast.success('Tag created successfully')
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
          <DialogDescription>
            Add a new tag to categorize events and resources.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">
              Tag name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tag-name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., FUNDRAISING, PODCAST"
              required
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use UPPERCASE letters, numbers, and hyphens only. No spaces.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tag color</Label>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {colorOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={`h-8 w-8 rounded-full border ${
                    color === item ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
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
              {loading ? "Creating..." : "Create Tag"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
