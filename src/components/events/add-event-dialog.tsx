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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type Tag = {
  id: string
  name: string
  color: string | null
}

type AddEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  tags: Tag[]
  onSuccess: () => void
}

export function AddEventDialog({
  open,
  onOpenChange,
  organizationId,
  tags,
  onSuccess,
}: AddEventDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setSelectedTags([])
    }
  }, [open])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      toast.error('Anda harus login untuk membuat acara')
      return
    }

    // Validate dates
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setLoading(false)
      toast.error('Tanggal berakhir harus setelah tanggal mulai')
      return
    }

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        org_id: organizationId,
        name: name.trim(),
        description: description.trim() || null,
        metadata: {
          start_date: startDate,
          end_date: endDate || null,
        },
        created_by: user.id,
      })
      .select()
      .single()

    if (eventError) {
      setLoading(false)
      toast.error('Gagal membuat acara')
      console.error(eventError)
      return
    }

    // Insert tag links if any tags selected
    if (selectedTags.length > 0 && event) {
      const tagLinks = selectedTags.map((tagId) => ({
        org_id: organizationId,
        event_id: event.id,
        tag_id: tagId,
      }))

      const { error: tagLinksError } = await supabase
        .from('event_tag_links')
        .insert(tagLinks)

      if (tagLinksError) {
        console.error('Failed to create tag links:', tagLinksError)
        // Don't fail the whole operation, just log it
      }
    }

    setLoading(false)
    toast.success('Acara berhasil dibuat')
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Acara Baru</DialogTitle>
          <DialogDescription>
            Tambahkan acara baru untuk organisasi Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">
              Nama Acara <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Diskusi Dwi-Bulanan: Identitas"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Deskripsi (opsional)</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat tentang acara ini"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">
                Tanggal Mulai <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Tanggal Berakhir (opsional)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan jika acara satu hari
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tag (opsional)</Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada tag tersedia. Buat tag terlebih dahulu untuk mengkategorikan acara.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.id) && (
                        <X className="ml-1 size-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Klik tag untuk menambah/menghapusnya.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Membuat..." : "Buat Acara"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
