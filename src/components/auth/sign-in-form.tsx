"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/client"

export function SignInForm() {
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  )
  const [message, setMessage] = React.useState<string | null>(null)

  const handleGoogle = async () => {
    setStatus("loading")
    setMessage(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus("error")
      setMessage("Google sign-in failed. Try again.")
      return
    }
  }

  const handleEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("loading")
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus("error")
      setMessage("Email sign-in failed. Try again.")
      return
    }

    setStatus("sent")
    setMessage("Check your email for a magic link.")
  }

  return (
    <Card className="w-full max-w-md bg-white/90 p-8 shadow-xl">
      <div className="space-y-2">
        <div className="text-2xl font-semibold">Welcome back</div>
        <p className="text-sm text-muted-foreground">
          Sign in with Google to keep things simple. Email is available, but
          it is slower.
        </p>
      </div>
      <div className="mt-6 grid gap-4">
        <Button onClick={handleGoogle} disabled={status === "loading"}>
          Continue with Google
        </Button>
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>
        <form onSubmit={handleEmail} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@lsm.id"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={status === "loading"}>
            Send magic link
          </Button>
        </form>
        {message ? (
          <p
            className={`text-xs ${
              status === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
