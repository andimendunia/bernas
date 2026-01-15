import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Member, JoinRequest, Permission, Role } from './permissions'

// Server-side only: Get all members of an org with their user data
export async function getOrgMembers(orgId: string): Promise<Member[]> {
  const supabase = await createSupabaseServerClient()
  
  // Get org members with roles
  const { data: membersData, error: membersError } = await supabase
    .from('org_members')
    .select(`
      *,
      role:roles (*)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  
  if (membersError) throw membersError
  if (!membersData || membersData.length === 0) return []
  
  // Get current user to access their session
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  // Create a map to store user info
  const userMap = new Map()
  
  // For each member, get their email using the helper function
  for (const member of membersData) {
    if (currentUser && member.user_id === currentUser.id) {
      // Current user - we have full info
      userMap.set(member.user_id, {
        email: currentUser.email || '',
        user_metadata: currentUser.user_metadata || {},
      })
    } else {
      // Other users - use RPC function to get email
      const { data: userEmail } = await supabase.rpc('get_user_email', {
        user_id: member.user_id
      })
      
      userMap.set(member.user_id, {
        email: userEmail || 'member@organization.com',
        user_metadata: {},
      })
    }
  }
  
  // Transform to match expected structure
  return membersData.map((member: any) => ({
    ...member,
    user: userMap.get(member.user_id) || {
      email: 'member@organization.com',
      user_metadata: {},
    },
  }))
}

// Server-side only: Get pending join requests for an org
export async function getPendingJoinRequests(
  orgId: string
): Promise<JoinRequest[]> {
  const supabase = await createSupabaseServerClient()
  
  // Get join requests
  const { data: requestsData, error: requestsError } = await supabase
    .from('join_requests')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
  
  if (requestsError) throw requestsError
  if (!requestsData || requestsData.length === 0) return []
  
  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  // Create a map to store user info
  const userMap = new Map()
  
  // For each request, get user info
  for (const request of requestsData) {
    if (currentUser && request.user_id === currentUser.id) {
      userMap.set(request.user_id, {
        email: currentUser.email || '',
        user_metadata: currentUser.user_metadata || {},
      })
    } else {
      const { data: userEmail } = await supabase.rpc('get_user_email', {
        user_id: request.user_id
      })
      
      userMap.set(request.user_id, {
        email: userEmail || 'requester@email.com',
        user_metadata: {},
      })
    }
  }
  
  // Transform to match expected structure
  return requestsData.map((request: any) => ({
    ...request,
    user: userMap.get(request.user_id) || {
      email: 'requester@email.com',
      user_metadata: {},
    },
  }))
}

// Server-side only: Get all permissions
export async function getAllPermissions(): Promise<Permission[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}

// Server-side only: Get all roles for an org
export async function getOrgRoles(orgId: string): Promise<Role[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}
