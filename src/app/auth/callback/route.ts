import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const authError = searchParams.get("error")

  if (!code) {
    const errorParam = authError ? `?error=${authError}` : "?error=missing_code"
    return NextResponse.redirect(new URL(`/auth/sign-in${errorParam}`, origin))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=auth", origin))
  }

  // Get user to determine redirect destination
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  // Check if user is onboarded
  if (!user || !user.user_metadata?.onboarded) {
    return NextResponse.redirect(new URL("/onboarding", origin))
  }

  // Try to get last visited org slug
  const lastVisitedSlug = user.user_metadata?.last_visited_org_slug as string | undefined
  
  if (lastVisitedSlug) {
    // Redirect to last visited org
    return NextResponse.redirect(new URL(`/${lastVisitedSlug}/overview`, origin))
  }

  // Fallback: get first org by active_org_id or fetch from database
  const activeOrgId = user.user_metadata?.active_org_id as string | undefined
  
  if (activeOrgId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", activeOrgId)
      .single()
    
    if (org?.slug) {
      return NextResponse.redirect(new URL(`/${org.slug}/overview`, origin))
    }
  }

  // Final fallback: redirect to onboarding if no org found
  return NextResponse.redirect(new URL("/onboarding", origin))
}
