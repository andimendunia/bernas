import { supabase } from '@/lib/supabase/client'

export type Permission = {
  id: string
  name: string
  description: string
  category: string
}

export type Role = {
  id: string
  org_id: string
  name: string
  description: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export type RoleWithPermissions = Role & {
  permissions: Permission[]
}

export type Member = {
  id: string
  org_id: string
  user_id: string
  is_admin: boolean
  role_id: string | null
  created_at: string
  user: {
    email: string
    user_metadata: {
      full_name?: string
      name?: string
      avatar_url?: string
      picture?: string
    }
  }
  role: Role | null
}

export type JoinRequest = {
  id: string
  org_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  notes: string | null
  user: {
    email: string
    user_metadata: {
      full_name?: string
      name?: string
      avatar_url?: string
      picture?: string
    }
  }
}

// Check if current user has a specific permission in an org
export async function hasPermission(
  orgId: string,
  permissionName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_permission', {
    check_org_id: orgId,
    permission_name: permissionName,
  })
  
  if (error) {
    console.error('Error checking permission:', error)
    return false
  }
  
  return data === true
}

// Check if current user is admin of an org
export async function isOrgAdmin(orgId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_org_admin', {
    check_org_id: orgId,
  })
  
  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }
  
  return data === true
}

// Get all permissions
export async function getAllPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}

// Get all roles for an org
export async function getOrgRoles(orgId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}

// Get role with its permissions
export async function getRoleWithPermissions(
  roleId: string
): Promise<RoleWithPermissions | null> {
  const { data, error } = await supabase
    .from('roles')
    .select(`
      *,
      role_permissions!inner (
        permissions (*)
      )
    `)
    .eq('id', roleId)
    .single()
  
  if (error) throw error
  if (!data) return null
  
  // Transform the nested structure
  const permissions = data.role_permissions?.map(
    (rp: any) => rp.permissions
  ) || []
  
  return {
    ...data,
    permissions,
  }
}

// NOTE: getOrgMembers and getPendingJoinRequests are in permissions-server.ts
// They require server-side auth.admin access to fetch user data

// Assign role to member
export async function assignRole(
  memberId: string,
  roleId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('org_members')
    .update({ role_id: roleId })
    .eq('id', memberId)
  
  if (error) throw error
}

// Remove member from org
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('id', memberId)
  
  if (error) throw error
}

// Create role
export async function createRole(
  orgId: string,
  name: string,
  description: string | null,
  permissionIds: string[],
  isDefault: boolean = false
): Promise<string> {
  // If setting as default, unset other defaults first
  if (isDefault) {
    await supabase
      .from('roles')
      .update({ is_default: false })
      .eq('org_id', orgId)
      .eq('is_default', true)
  }
  
  // Create role
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .insert({
      org_id: orgId,
      name,
      description,
      is_default: isDefault,
    })
    .select()
    .single()
  
  if (roleError) throw roleError
  
  // Assign permissions
  if (permissionIds.length > 0) {
    const { error: permError } = await supabase
      .from('role_permissions')
      .insert(
        permissionIds.map(permId => ({
          role_id: roleData.id,
          permission_id: permId,
        }))
      )
    
    if (permError) throw permError
  }
  
  return roleData.id
}

// Update role
export async function updateRole(
  roleId: string,
  name: string,
  description: string | null,
  permissionIds: string[],
  isDefault: boolean = false
): Promise<void> {
  // Get role's org_id
  const { data: role } = await supabase
    .from('roles')
    .select('org_id')
    .eq('id', roleId)
    .single()
  
  if (!role) throw new Error('Role not found')
  
  // If setting as default, unset other defaults first
  if (isDefault) {
    await supabase
      .from('roles')
      .update({ is_default: false })
      .eq('org_id', role.org_id)
      .eq('is_default', true)
      .neq('id', roleId)
  }
  
  // Update role
  const { error: roleError } = await supabase
    .from('roles')
    .update({
      name,
      description,
      is_default: isDefault,
    })
    .eq('id', roleId)
  
  if (roleError) throw roleError
  
  // Delete existing permissions
  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)
  
  if (deleteError) throw deleteError
  
  // Insert new permissions
  if (permissionIds.length > 0) {
    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert(
        permissionIds.map(permId => ({
          role_id: roleId,
          permission_id: permId,
        }))
      )
    
    if (insertError) throw insertError
  }
}

// Delete role
export async function deleteRole(roleId: string): Promise<void> {
  // Check if any members are assigned to this role
  const { data: members } = await supabase
    .from('org_members')
    .select('id')
    .eq('role_id', roleId)
    .limit(1)
  
  if (members && members.length > 0) {
    throw new Error('Cannot delete role with assigned members. Please reassign members first.')
  }
  
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', roleId)
  
  if (error) throw error
}

// Approve join request
export async function approveJoinRequest(
  requestId: string,
  roleId: string | null = null
): Promise<void> {
  const { error } = await supabase.rpc('approve_join_request', {
    request_id: requestId,
    assign_role_id: roleId,
  })
  
  if (error) throw error
}

// Reject join request
export async function rejectJoinRequest(
  requestId: string,
  notes: string | null = null
): Promise<void> {
  const { error } = await supabase.rpc('reject_join_request', {
    request_id: requestId,
    rejection_notes: notes,
  })
  
  if (error) throw error
}
