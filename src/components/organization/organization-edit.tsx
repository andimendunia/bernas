"use client"

import * as React from "react"
import { Smile } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type OrganizationEditProps = {
  organization: {
    id: string
    name: string
    avatar_emoji: string
    avatar_color: string
  }
}

const emojiOptions = [
  "🏢", "🏛️", "🏫", "🏥", "🏪", "🌍", "🌎", "🌏", "🌳", "🌱",
  "🌿", "🍃", "🌾", "🌻", "🌈", "⭐", "✨", "💫", "🔥", "💧",
  "💚", "💙", "❤️", "🧡", "💛", "🤝", "👥", "🎯", "🎪", "🎨",
  "🎭", "🎸", "🎤", "📚", "📖", "✏️", "🖊️", "🔧", "🔨", "⚙️",
  "🛠️", "🚀", "🛸", "🦄", "🐙", "🦖", "🍕", "🌮", "🍜", "☕",
  "🎓", "🎒", "🏆", "🥇", "🎖️", "🏅", "🎗️", "🎀", "🎁", "🎉",
  "🎊", "🎈", "🌟", "💡", "🔔", "📢", "📣", "🎺", "🎷", "🥁",
  "🎹", "🦅", "🦉", "🐝", "🐢", "🦋", "🐬", "🐘", "🦁", "🐼",
  "🐨", "🦘", "🦒", "🐧", "🦩", "🐳", "🐟", "🌺", "🌸", "🌼",
  "🌷", "🥀", "🍀", "🌵", "🎋", "🏔️", "⛰️", "🗻", "🌋", "🏝️",
  "🏖️", "🏜️", "🏕️", "🎣", "⛺", "🧭", "🗺️", "🧳", "⛵", "🚣",
  "🛶", "🏄", "🤿", "🧗",
]

const colorOptions = [
  "#f2b5b5", "#f0c6a4", "#f4dfb6", "#cfe5c1",
  "#bfd6ea", "#d2c8e8", "#e6c1d9", "#c9d2d6",
]

export function OrganizationEdit({
  organization,
}: OrganizationEditProps) {
  const router = useRouter()
  const [name, setName] = React.useState(organization.name)
  const [emoji, setEmoji] = React.useState(organization.avatar_emoji)
  const [color, setColor] = React.useState(organization.avatar_color)
  const [emojiPopoverOpen, setEmojiPopoverOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('organizations')
      .update({
        name,
        avatar_emoji: emoji,
        avatar_color: color,
      })
      .eq('id', organization.id)

    setLoading(false)

    if (error) {
      toast.error('Failed to update organization')
      return
    }

    toast.success('Organization updated successfully')
    router.push('/dashboard/organization/info')
    router.refresh()
  }

  return (
    <div className="w-full max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Edit Organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your organization&apos;s name and appearance
        </p>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 p-4">
            <div
              className="flex size-16 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: color }}
            >
              {emoji}
            </div>
            <div>
              <div className="font-medium">{name || "Organization name"}</div>
              <div className="text-xs text-muted-foreground">
                Preview of your organization
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Organization icon</Label>
            <div className="relative">
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.trim().slice(0, 2))}
                placeholder="Type emoji or initials"
                className="pr-10"
              />
              <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Smile className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="h-52 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-2">
                      {emojiOptions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setEmoji(item)
                            setEmojiPopoverOpen(false)
                          }}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                            emoji === item
                              ? "border-primary/40 bg-primary/10"
                              : "border-border bg-white"
                          }`}
                        >
                          <span className="text-base">{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
