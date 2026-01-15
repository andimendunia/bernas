"use client"

import * as React from "react"
import { Smile } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/lib/supabase/client"

type OrganizationProfileFormProps = {
  organization: {
    id: string
    name: string
    join_code: string
    avatar_emoji: string
    avatar_color: string
  }
}

const emojiOptions = [
  "🏢",
  "🏛️",
  "🏫",
  "🏥",
  "🏪",
  "🌍",
  "🌎",
  "🌏",
  "🌳",
  "🌱",
  "🌿",
  "🍃",
  "🌾",
  "🌻",
  "🌈",
  "⭐",
  "✨",
  "💫",
  "🔥",
  "💧",
  "💚",
  "💙",
  "❤️",
  "🧡",
  "💛",
  "🤝",
  "👥",
  "🎯",
  "🎪",
  "🎨",
  "🎭",
  "🎸",
  "🎤",
  "📚",
  "📖",
  "✏️",
  "🖊️",
  "🔧",
  "🔨",
  "⚙️",
  "🛠️",
  "🚀",
  "🛸",
  "🦄",
  "🐙",
  "🦖",
  "🍕",
  "🌮",
  "🍜",
  "☕",
  "🎓",
  "🎒",
  "🏆",
  "🥇",
  "🎖️",
  "🏅",
  "🎗️",
  "🎀",
  "🎁",
  "🎉",
  "🎊",
  "🎈",
  "🌟",
  "💡",
  "🔔",
  "📢",
  "📣",
  "🎺",
  "🎷",
  "🥁",
  "🎹",
  "🦅",
  "🦉",
  "🐝",
  "🐢",
  "🦋",
  "🐬",
  "🐘",
  "🦁",
  "🐼",
  "🐨",
  "🦘",
  "🦒",
  "🐧",
  "🦩",
  "🐳",
  "🐟",
  "🌺",
  "🌸",
  "🌼",
  "🌷",
  "🥀",
  "🍀",
  "🌵",
  "🎋",
  "🏔️",
  "⛰️",
  "🗻",
  "🌋",
  "🏝️",
  "🏖️",
  "🏜️",
  "🏕️",
  "🎣",
  "⛺",
  "🧭",
  "🗺️",
  "🧳",
  "⛵",
  "🚣",
  "🛶",
  "🏄",
  "🤿",
  "🧗",
]
const colorOptions = [
  "#f2b5b5",
  "#f0c6a4",
  "#f4dfb6",
  "#cfe5c1",
  "#bfd6ea",
  "#d2c8e8",
  "#e6c1d9",
  "#c9d2d6",
]

export function OrganizationProfileForm({
  organization,
}: OrganizationProfileFormProps) {
  const router = useRouter()
  const [name, setName] = React.useState(organization.name)
  const [emoji, setEmoji] = React.useState(organization.avatar_emoji)
  const [color, setColor] = React.useState(organization.avatar_color)
  const [emojiPopoverOpen, setEmojiPopoverOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        avatar_emoji: emoji,
        avatar_color: color,
      })
      .eq("id", organization.id)

    setSaving(false)

    if (error) {
      setMessage("Could not update the organization.")
      return
    }

    setMessage("Organization updated.")
    router.refresh()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(organization.join_code)
    setMessage("Join code copied.")
  }

  return (
    <Card className="w-full max-w-md bg-white/90 p-6 shadow-xl">
      <div className="space-y-1">
        <div className="text-xl font-semibold">Organization profile</div>
        <p className="text-sm text-muted-foreground">
          Update your LSM profile and share the join code.
        </p>
      </div>
      <form onSubmit={handleSave} className="mt-6 grid gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-white/70 p-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          >
            {emoji}
          </div>
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">
              Preview of the organization icon
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Organization icon</Label>
          <div className="relative">
            <Input
              id="org-emoji"
              value={emoji}
              onChange={(event) =>
                setEmoji(event.target.value.trim().slice(0, 2))
              }
              placeholder="Type initials or custom emoji here"
              className="pr-10"
            />
            <Popover
              open={emojiPopoverOpen}
              onOpenChange={setEmojiPopoverOpen}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Pick an emoji"
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
                        onClick={() => setEmoji(item)}
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
        </div>
        <div className="grid gap-2">
          <div className="flex flex-wrap justify-center gap-2">
            {colorOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setColor(item)}
                className={`h-8 w-8 rounded-full border ${
                  color === item ? "border-primary" : "border-border"
                }`}
                style={{ backgroundColor: item }}
                aria-label={`Select ${item}`}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="join-code">Join code</Label>
          <div className="flex gap-2">
            <Input id="join-code" value={organization.join_code} readOnly />
            <Button type="button" variant="outline" onClick={handleCopy}>
              Copy
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            Save changes
          </Button>
          {message ? (
            <span className="text-xs text-muted-foreground">{message}</span>
          ) : null}
        </div>
      </form>
    </Card>
  )
}
