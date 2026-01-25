"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Smile } from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SlugInput } from "@/components/onboarding/slug-input"
import { supabase } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createName, setCreateName] = React.useState("")
  const [orgSlug, setOrgSlug] = React.useState("")
  const [isSlugValid, setIsSlugValid] = React.useState(false)
  const [joinCode, setJoinCode] = React.useState("")
  const [emoji, setEmoji] = React.useState("🤝")
  const [color, setColor] = React.useState("#f2b5b5")
  const [emojiPopoverOpen, setEmojiPopoverOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false)
  const [lastVisitedSlug, setLastVisitedSlug] = React.useState<string | null>(null)
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

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { data: orgData, error: orgError } = await supabase.rpc(
      "create_org_with_member",
      {
        org_name: createName,
        org_slug: orgSlug,
        org_emoji: emoji,
        org_color: color,
      }
    )

    if (orgError || !orgData) {
      setError("Could not create the organization yet.")
      setLoading(false)
      return
    }

    // Metadata is automatically updated by database trigger
    // Refresh the session to get updated app_metadata
    await supabase.auth.refreshSession()
    
    // Redirect to the new organization
    router.push(`/${orgSlug}/overview`)
  }

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { data: requestId, error: requestError } = await supabase.rpc(
      "create_join_request",
      {
        join_code: joinCode,
      }
    )

    setLoading(false)

    if (requestError) {
      console.error('Join request error:', requestError)
      if (requestError.message.includes('Invalid join code')) {
        setError("Invalid join code. Please check and try again.")
      } else if (requestError.message.includes('Already a member')) {
        setError("You are already a member of this organization.")
      } else {
        setError(`Could not send join request: ${requestError.message}`)
      }
      return
    }

    // Show success message - request sent and pending approval
    setJoinCode("")
    setSuccessDialogOpen(true)
  }

  const mode = searchParams.get("mode")
  const defaultTab = mode === "add" ? "create" : "join"

  React.useEffect(() => {
    const checkOnboarding = async () => {
      const { data } = await supabase.auth.getUser()
      // Check app_metadata for onboarding status (not user_metadata)
      const appMetadata = data.user?.app_metadata as { onboarded?: boolean; last_visited_org_slug?: string }
      const onboarded = appMetadata?.onboarded
      const lastSlug = appMetadata?.last_visited_org_slug

      if (lastSlug) {
        setLastVisitedSlug(lastSlug)
      }

      if (onboarded && mode !== "add" && lastSlug) {
        router.replace(`/${lastSlug}/overview`)
      }
    }

    void checkOnboarding()
  }, [mode, router])

  return (
    <div className="min-h-screen bg-[#fff8f7]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="text-lg font-semibold tracking-tight">Bernas</div>
          </div>
          {mode === "add" && lastVisitedSlug ? (
            <a
              href={`/${lastVisitedSlug}/overview`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to Organization
            </a>
          ) : null}
        </header>
        <main className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md bg-white/90 p-8 shadow-xl">
            <div className="space-y-2">
              <div className="text-2xl font-semibold">
                Set up your organization
              </div>
              <p className="text-sm text-muted-foreground">
                Create a new LSM workspace or join an existing one.
              </p>
            </div>
            <Tabs key={defaultTab} defaultValue={defaultTab} className="mt-6">
              <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg border border-border bg-white p-1">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-primary/20 data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Create organization
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-primary/20 data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Join with code
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create" className="mt-6">
                <form onSubmit={handleCreate} className="grid gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-white/70 p-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    >
                      {emoji}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {createName || "Your organization"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Preview of the organization icon
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-name">Organization name</Label>
                    <Input
                      id="org-name"
                      placeholder="LSM Bahari"
                      value={createName}
                      onChange={(event) => setCreateName(event.target.value)}
                      required
                    />
                  </div>
                  <SlugInput
                    orgName={createName}
                    value={orgSlug}
                    onChange={setOrgSlug}
                    onValidationChange={setIsSlugValid}
                  />
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
                  <Button type="submit" disabled={loading || !isSlugValid}>
                    Create workspace
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="join" className="mt-6">
                <form onSubmit={handleJoin} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="join-code">Join code</Label>
                    <Input
                      id="join-code"
                      placeholder="BERNAS-2024"
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={loading}>
                    Join workspace
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            {error ? (
              <p className="mt-4 text-xs text-destructive">{error}</p>
            ) : null}
          </Card>
        </main>
      </div>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Request Sent!</DialogTitle>
            <DialogDescription>
              Your request to join the organization has been sent successfully. An admin needs to approve your request before you can access the organization.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
