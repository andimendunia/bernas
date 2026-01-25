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
  const [password, setPassword] = React.useState("")
  const [usePassword, setUsePassword] = React.useState(true) // Default to password for local dev
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

    if (usePassword) {
      // Password-based sign-in (for local development)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setStatus("error")
        setMessage("Sign-in failed. Check your email and password.")
        return
      }

      // Redirect on success based on app metadata
      const user = data.user
      
      // Debug logging (remove in production)
      console.log("User data:", user)
      console.log("App metadata:", user?.app_metadata)
      console.log("Onboarded:", user?.app_metadata?.onboarded)
      console.log("Last visited slug:", user?.app_metadata?.last_visited_org_slug)
      
      if (!user || !user.app_metadata?.onboarded) {
        console.log("Redirecting to onboarding - user not onboarded")
        window.location.href = "/onboarding"
        return
      }

      const lastVisitedSlug = user.app_metadata?.last_visited_org_slug
      if (lastVisitedSlug) {
        console.log("Redirecting to:", `/${lastVisitedSlug}/overview`)
        window.location.href = `/${lastVisitedSlug}/overview`
        return
      }

      // Fallback to onboarding if no org found
      console.log("No org slug found, redirecting to onboarding")
      window.location.href = "/onboarding"
    } else {
      // Magic link sign-in (for production)
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
  }

  return (
    <Card className="w-full max-w-md bg-white/90 p-8 shadow-xl">
      <div className="space-y-2">
        <div className="text-2xl font-semibold">Welcome back</div>
        <p className="text-sm text-muted-foreground">
          {usePassword
            ? "Sign in with your test account credentials."
            : "Sign in with Google to keep things simple. Email is available, but it is slower."}
        </p>
      </div>
      <div className="mt-6 grid gap-4">
        {!usePassword && (
          <>
            <Button onClick={handleGoogle} disabled={status === "loading"}>
              Continue with Google
            </Button>
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>
          </>
        )}
        <form onSubmit={handleEmail} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={usePassword ? "alice@test.com" : "you@lsm.id"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {usePassword && (
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password123"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          )}
          <Button type="submit" variant="outline" disabled={status === "loading"}>
            {usePassword ? "Sign in" : "Send magic link"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setUsePassword(!usePassword)}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {usePassword ? "Use magic link instead" : "Use password instead (for testing)"}
        </button>
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
