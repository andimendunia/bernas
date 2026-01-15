import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Create or Join Organization - Bernas",
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect("/auth/sign-in")
  }

  return <>{children}</>
}
