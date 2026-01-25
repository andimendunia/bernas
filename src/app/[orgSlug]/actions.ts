"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Update user's active organization in app_metadata
 * This is called when user switches organizations
 */
export async function updateActiveOrg(orgId: string, orgSlug: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Call RPC to update app_metadata (only updates active_org_id and last_visited_org_slug)
  const { error } = await supabase.rpc("update_user_active_org", {
    target_org_id: orgId,
    target_org_slug: orgSlug,
  })

  if (error) {
    console.error("Failed to update active org:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
