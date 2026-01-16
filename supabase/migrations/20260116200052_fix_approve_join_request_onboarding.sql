-- Fix approve_join_request to update user metadata for onboarding
-- This ensures users are marked as onboarded when their join request is approved

create or replace function public.approve_join_request(
  request_id uuid,
  assign_role_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
  default_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get request details
  select * into req
  from public.join_requests
  where id = request_id and status = 'pending';
  
  if req is null then
    raise exception 'Join request not found or already processed';
  end if;
  
  -- Check if approver has permission
  if not public.has_permission(req.org_id, 'join_requests.approve') then
    raise exception 'No permission to approve join requests';
  end if;
  
  -- If no role specified, get default role
  if assign_role_id is null then
    select id into default_role_id
    from public.roles
    where org_id = req.org_id and is_default = true
    limit 1;
    
    assign_role_id := default_role_id;
  end if;
  
  -- Add member
  insert into public.org_members (org_id, user_id, role_id)
  values (req.org_id, req.user_id, assign_role_id);
  
  -- Update request
  update public.join_requests
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = (select auth.uid())
  where id = request_id;
  
  -- Update user metadata to mark as onboarded and set active org
  update auth.users
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'onboarded', true,
      'org_id', req.org_id,
      'active_org_id', req.org_id
    )
  where id = req.user_id;
end;
$$;
