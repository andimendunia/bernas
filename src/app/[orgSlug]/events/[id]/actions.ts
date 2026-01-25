'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

type TaskStatus = 'todo' | 'in_progress' | 'done'

type ActionResult = {
  success: boolean
  error?: string
}

type CreateTaskResult = ActionResult & {
  taskId?: string
}

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'done']

const getStringValue = (formData: FormData, key: string): string | null => {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const getRequiredString = (formData: FormData, key: string): string | null => {
  return getStringValue(formData, key)
}

const parseStatus = (value: string | null): TaskStatus | null => {
  if (!value) return null
  if (validStatuses.includes(value as TaskStatus)) {
    return value as TaskStatus
  }
  return null
}

const parseDeadline = (value: string | null): string | null | 'invalid' => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'invalid'
  return date.toISOString()
}

const parseSkillIds = (formData: FormData): string[] => {
  const allValues = formData.getAll('skillIds')
  const normalized = allValues
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)

  if (normalized.length > 1) {
    return Array.from(new Set(normalized))
  }

  const singleValue = getStringValue(formData, 'skillIds')
  if (!singleValue) return []

  if (singleValue.startsWith('[')) {
    try {
      const parsed = JSON.parse(singleValue) as string[]
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.map((item) => item.trim()).filter(Boolean)))
      }
    } catch {
      return []
    }
  }

  if (singleValue.includes(',')) {
    return Array.from(
      new Set(
        singleValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }

  return [singleValue]
}

const insertTaskSkillLinks = async (
  supabase: SupabaseClient,
  orgId: string,
  taskId: string,
  skillIds: string[]
) => {
  if (skillIds.length === 0) return { error: null }

  const { error } = await supabase.from('task_skill_links').insert(
    skillIds.map((skillId) => ({
      org_id: orgId,
      task_id: taskId,
      skill_id: skillId,
    }))
  )

  return { error }
}

export async function createTask(formData: FormData): Promise<CreateTaskResult> {
  const supabase = await createSupabaseServerClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const orgId = getRequiredString(formData, 'orgId')
  const title = getRequiredString(formData, 'title')

  if (!orgId || !title) {
    return { success: false, error: 'Missing required fields' }
  }

  const { data: hasPermission, error: permissionError } = await supabase.rpc(
    'has_permission',
    {
      check_org_id: orgId,
      permission_name: 'tasks.create',
    }
  )

  if (permissionError) {
    return { success: false, error: permissionError.message }
  }

  if (hasPermission !== true) {
    return { success: false, error: 'Permission denied' }
  }

  const eventId = getStringValue(formData, 'eventId')
  const description = getStringValue(formData, 'description')
  const status = parseStatus(getStringValue(formData, 'status'))
  const deadlineValue = parseDeadline(getStringValue(formData, 'deadline'))
  const assigneeMemberId = getStringValue(formData, 'assigneeMemberId')
  const skillIds = parseSkillIds(formData)

  if (!status) {
    return { success: false, error: 'Invalid status' }
  }

  if (deadlineValue === 'invalid') {
    return { success: false, error: 'Invalid deadline' }
  }

  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .insert({
      org_id: orgId,
      event_id: eventId,
      title,
      description,
      status,
      deadline: deadlineValue,
      assignee_member_id: assigneeMemberId,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (taskError || !taskData) {
    return { success: false, error: taskError?.message || 'Failed to create task' }
  }

  const { error: linkError } = await insertTaskSkillLinks(
    supabase,
    orgId,
    taskData.id,
    skillIds
  )

  if (linkError) {
    await supabase.from('tasks').delete().eq('id', taskData.id)
    return { success: false, error: linkError.message }
  }

  return { success: true, taskId: taskData.id }
}

export async function updateTask(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const taskId = getRequiredString(formData, 'taskId')
  const orgId = getRequiredString(formData, 'orgId')
  const title = getRequiredString(formData, 'title')

  if (!taskId || !orgId || !title) {
    return { success: false, error: 'Missing required fields' }
  }

  const { data: hasPermission, error: permissionError } = await supabase.rpc(
    'has_permission',
    {
      check_org_id: orgId,
      permission_name: 'tasks.edit',
    }
  )

  if (permissionError) {
    return { success: false, error: permissionError.message }
  }

  if (hasPermission !== true) {
    return { success: false, error: 'Permission denied' }
  }

  const description = getStringValue(formData, 'description')
  const status = parseStatus(getStringValue(formData, 'status'))
  const deadlineValue = parseDeadline(getStringValue(formData, 'deadline'))
  const assigneeMemberId = getStringValue(formData, 'assigneeMemberId')
  const skillIds = parseSkillIds(formData)

  if (!status) {
    return { success: false, error: 'Invalid status' }
  }

  if (deadlineValue === 'invalid') {
    return { success: false, error: 'Invalid deadline' }
  }

  const { error: taskError } = await supabase
    .from('tasks')
    .update({
      title,
      description,
      status,
      deadline: deadlineValue,
      assignee_member_id: assigneeMemberId,
    })
    .eq('id', taskId)
    .eq('org_id', orgId)

  if (taskError) {
    return { success: false, error: taskError.message }
  }

  const { error: deleteError } = await supabase
    .from('task_skill_links')
    .delete()
    .eq('task_id', taskId)
    .eq('org_id', orgId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  const { error: linkError } = await insertTaskSkillLinks(
    supabase,
    orgId,
    taskId,
    skillIds
  )

  if (linkError) {
    return { success: false, error: linkError.message }
  }

  return { success: true }
}

export async function deleteTask(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const taskId = getRequiredString(formData, 'taskId')
  const orgId = getRequiredString(formData, 'orgId')

  if (!taskId || !orgId) {
    return { success: false, error: 'Missing required fields' }
  }

  const { data: hasPermission, error: permissionError } = await supabase.rpc(
    'has_permission',
    {
      check_org_id: orgId,
      permission_name: 'tasks.delete',
    }
  )

  if (permissionError) {
    return { success: false, error: permissionError.message }
  }

  if (hasPermission !== true) {
    return { success: false, error: 'Permission denied' }
  }

  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('org_id', orgId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  return { success: true }
}
