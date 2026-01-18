import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Server Components cannot mutate cookies
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {
          // Server Components cannot mutate cookies
        }
      },
    },
  })
}
