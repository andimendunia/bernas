-- =====================================================================
-- USER METADATA TRIGGER
-- =====================================================================
-- This migration creates a trigger to automatically update user's
-- app_metadata when they create or join an organization.
-- 
-- app_metadata stores:
-- - onboarded: boolean (true after first org setup)
-- - org_id: uuid (first organization joined - kept for backward compatibility)
-- - active_org_id: uuid (currently active organization)
-- - last_visited_org_slug: text (for redirect after login)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FUNCTION TO UPDATE USER ACTIVE ORG
-- ---------------------------------------------------------------------

-- Function to update user's active organization and last visited slug
-- This preserves existing app_metadata and only updates specific fields
create or replace function public.update_user_active_org(
  target_org_id uuid,
  target_org_slug text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  existing_metadata jsonb;
begin
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get existing app_metadata
  select raw_app_meta_data into existing_metadata
  from auth.users
  where id = current_user_id;
  
  -- Update only active_org_id and last_visited_org_slug, preserve everything else
  update auth.users
  set raw_app_meta_data = coalesce(existing_metadata, '{}'::jsonb) || jsonb_build_object(
    'active_org_id', target_org_id,
    'last_visited_org_slug', target_org_slug
  )
  where id = current_user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.update_user_active_org(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 2. TRIGGER FUNCTION FOR ORG_MEMBERS INSERT
-- ---------------------------------------------------------------------

create or replace function public.handle_new_org_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_slug_value text;
  existing_metadata jsonb;
  is_first_org boolean;
begin
  -- Get the organization's slug
  select slug into org_slug_value
  from organizations
  where id = NEW.org_id;
  
  -- Get existing app_metadata
  select raw_app_meta_data into existing_metadata
  from auth.users
  where id = NEW.user_id;
  
  -- Check if this is the user's first organization
  is_first_org := (existing_metadata->>'onboarded')::boolean is not true;
  
  if is_first_org then
    -- First org: set all metadata
    update auth.users
    set raw_app_meta_data = coalesce(existing_metadata, '{}'::jsonb) || jsonb_build_object(
      'onboarded', true,
      'org_id', NEW.org_id,
      'active_org_id', NEW.org_id,
      'last_visited_org_slug', org_slug_value
    )
    where id = NEW.user_id;
  else
    -- Subsequent org: only update active_org_id and last_visited_org_slug
    update auth.users
    set raw_app_meta_data = coalesce(existing_metadata, '{}'::jsonb) || jsonb_build_object(
      'active_org_id', NEW.org_id,
      'last_visited_org_slug', org_slug_value
    )
    where id = NEW.user_id;
  end if;
  
  return NEW;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. CREATE TRIGGER
-- ---------------------------------------------------------------------

-- Drop trigger if exists (for migration reruns)
drop trigger if exists on_org_member_created on public.org_members;

-- Create trigger that fires AFTER insert on org_members
create trigger on_org_member_created
  after insert on public.org_members
  for each row
  execute function public.handle_new_org_member();

-- ---------------------------------------------------------------------
-- 4. BACKFILL EXISTING USERS
-- ---------------------------------------------------------------------

-- Update app_metadata for existing users who are already members
-- This ensures users created before this migration get proper metadata
do $$
declare
  member_record record;
  org_slug_value text;
  existing_metadata jsonb;
begin
  for member_record in 
    select distinct on (user_id) 
      user_id, 
      org_id, 
      created_at
    from org_members
    order by user_id, created_at asc
  loop
    -- Get org slug
    select slug into org_slug_value
    from organizations
    where id = member_record.org_id;
    
    -- Get existing metadata
    select raw_app_meta_data into existing_metadata
    from auth.users
    where id = member_record.user_id;
    
    -- Update user's app_metadata
    update auth.users
    set raw_app_meta_data = coalesce(existing_metadata, '{}'::jsonb) || jsonb_build_object(
      'onboarded', true,
      'org_id', member_record.org_id,
      'active_org_id', member_record.org_id,
      'last_visited_org_slug', org_slug_value
    )
    where id = member_record.user_id;
  end loop;
end;
$$;
