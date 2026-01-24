"use client"

import * as React from "react"
import { Check, Loader2, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

type SlugInputProps = {
  orgName: string
  value: string
  onChange: (value: string) => void
  onValidationChange: (isValid: boolean) => void
  error?: string
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MIN_SLUG_LENGTH = 3
const MAX_SLUG_LENGTH = 50

const slugify = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
}

export function SlugInput({
  orgName,
  value,
  onChange,
  onValidationChange,
  error,
}: SlugInputProps) {
  const [status, setStatus] = React.useState<
    "idle" | "checking" | "available" | "unavailable" | "invalid"
  >("idle")
  const [message, setMessage] = React.useState<string | null>(null)
  const [lastSuggested, setLastSuggested] = React.useState("")

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const suggested = slugify(orgName)

      if ((value === "" || value === lastSuggested) && suggested !== value) {
        onChange(suggested)
        setLastSuggested(suggested)
        return
      }

      if (lastSuggested !== suggested && value === lastSuggested) {
        setLastSuggested(suggested)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [orgName, value, lastSuggested, onChange])

  React.useEffect(() => {
    if (!value) {
      setStatus("idle")
      setMessage(null)
      onValidationChange(false)
      return
    }

    const isValidFormat =
      SLUG_PATTERN.test(value) &&
      value.length >= MIN_SLUG_LENGTH &&
      value.length <= MAX_SLUG_LENGTH

    if (!isValidFormat) {
      setStatus("invalid")
      setMessage(
        "Use 3-50 lowercase letters, numbers, and single hyphens only."
      )
      onValidationChange(false)
      return
    }

    setStatus("checking")
    setMessage(null)
    onValidationChange(false)

    let isActive = true
    const timeout = setTimeout(() => {
      void (async () => {
        const { data, error: rpcError } = await supabase.rpc(
          "check_slug_available",
          {
            check_slug: value,
          }
        )

        if (!isActive) return

        if (rpcError) {
          setStatus("invalid")
          setMessage("We couldn't validate this slug just yet.")
          onValidationChange(false)
          return
        }

        if (data === true) {
          setStatus("available")
          setMessage(null)
          onValidationChange(true)
          return
        }

        setStatus("unavailable")
        setMessage("This slug is already taken or reserved.")
        onValidationChange(false)
      })()
    }, 300)

    return () => {
      isActive = false
      clearTimeout(timeout)
    }
  }, [value, onValidationChange])

  const displayError = error ?? message
  const previewSlug = value || "your-slug"

  return (
    <div className="grid gap-2">
      <Label htmlFor="org-slug">Organization URL slug</Label>
      <div className="relative">
        <Input
          id="org-slug"
          placeholder="lsm-bahari"
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          className="pr-10"
          required
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : null}
          {status === "available" ? (
            <Check className="size-4 text-emerald-500" />
          ) : null}
          {status === "unavailable" || status === "invalid" ? (
            <X className="size-4 text-destructive" />
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Your organization URL: {" "}
        <span className="font-medium text-foreground">
          bernas.app/{previewSlug}
        </span>
      </p>
      {displayError ? (
        <p className="text-xs text-destructive">{displayError}</p>
      ) : null}
    </div>
  )
}
