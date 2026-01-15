-- =====================================================================
-- PHASE 1: ROLES AND PERMISSIONS SYSTEM
-- =====================================================================
-- This migration adds a comprehensive roles and permissions system
-- for organization management in Bernas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1 CREATE ENUMS
-- ---------------------------------------------------------------------

-- Join request status enum
create type public.join_request_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------
-- 1.2 CREATE NEW TABLES
-- ---------------------------------------------------------------------

-- Permissions table: Predefined system permissions (read-only for users)
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,  -- e.g., "events.view", "members.remove"
  description text not null,
  category text not null,  -- "events", "tasks", "members", "resources", "organization", "roles", "join_requests"
  created_at timestamptz not null default now()
);

create index on public.permissions (category);

-- Roles table: Custom roles per organization
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,  -- Auto-assign to new members
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index on public.roles (org_id);
create index on public.roles (org_id, is_default);

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

-- Role_permissions table: Many-to-many relationship between roles and permissions
create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

create index on public.role_permissions (role_id);
create index on public.role_permissions (permission_id);

-- Join_requests table: Pending membership requests
create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.join_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  notes text  -- Optional rejection reason or notes
);

-- Create partial unique index to allow only one pending request per user per org
create unique index join_requests_pending_unique 
on public.join_requests (org_id, user_id) 
where status = 'pending';

create index on public.join_requests (org_id, status);
create index on public.join_requests (user_id);
create index on public.join_requests (org_id, user_id);

-- ---------------------------------------------------------------------
-- 1.3 MODIFY EXISTING TABLES
-- ---------------------------------------------------------------------

-- Update org_members table: Add admin flag and role reference
alter table public.org_members
  add column if not exists is_admin boolean not null default false,
  add column if not exists role_id uuid references public.roles(id) on delete set null;

create index on public.org_members (org_id, is_admin);
create index on public.org_members (role_id);

-- ---------------------------------------------------------------------
-- 1.4 SEED PERMISSIONS
-- ---------------------------------------------------------------------

insert into public.permissions (name, description, category) values
  -- Events
  ('events.view', 'View events', 'events'),
  ('events.create', 'Create new events', 'events'),
  ('events.edit', 'Edit existing events', 'events'),
  ('events.delete', 'Delete events', 'events'),
  
  -- Tasks
  ('tasks.view', 'View tasks', 'tasks'),
  ('tasks.create', 'Create new tasks', 'tasks'),
  ('tasks.edit', 'Edit existing tasks', 'tasks'),
  ('tasks.delete', 'Delete tasks', 'tasks'),
  ('tasks.assign', 'Assign tasks to members', 'tasks'),
  
  -- Members
  ('members.view', 'View organization members', 'members'),
  ('members.invite', 'Invite new members', 'members'),
  ('members.remove', 'Remove members from organization', 'members'),
  ('members.change_role', 'Change member roles', 'members'),
  
  -- Resources
  ('resources.view', 'View resources', 'resources'),
  ('resources.create', 'Create new resources', 'resources'),
  ('resources.edit', 'Edit existing resources', 'resources'),
  ('resources.delete', 'Delete resources', 'resources'),
  
  -- Organization
  ('org.edit_settings', 'Edit organization settings', 'organization'),
  ('org.delete', 'Delete organization', 'organization'),
  
  -- Roles
  ('roles.view', 'View roles', 'roles'),
  ('roles.create', 'Create new roles', 'roles'),
  ('roles.edit', 'Edit existing roles', 'roles'),
  ('roles.delete', 'Delete roles', 'roles'),
  
  -- Join Requests
  ('join_requests.view', 'View join requests', 'join_requests'),
  ('join_requests.approve', 'Approve or reject join requests', 'join_requests');

-- ---------------------------------------------------------------------
-- 1.5 HELPER FUNCTIONS
-- ---------------------------------------------------------------------

-- Function: is_org_admin
-- Check if the current user is an admin of a specific organization
create or replace function public.is_org_admin(check_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members
    where org_id = check_org_id
      and user_id = auth.uid()
      and is_admin = true
  );
$$;

-- Function: has_permission
-- Check if user has specific permission (admins bypass)
create or replace function public.has_permission(check_org_id uuid, permission_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Admins have all permissions
  if public.is_org_admin(check_org_id) then
    return true;
  end if;
  
  -- Check if user's role has the permission
  return exists (
    select 1
    from public.org_members om
    join public.role_permissions rp on rp.role_id = om.role_id
    join public.permissions p on p.id = rp.permission_id
    where om.org_id = check_org_id
      and om.user_id = auth.uid()
      and p.name = permission_name
  );
end;
$$;

-- Function: create_join_request
-- User creates request to join an organization
create or replace function public.create_join_request(join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Find organization by join code
  select id into target_org_id
  from public.organizations
  where organizations.join_code = create_join_request.join_code;
  
  if target_org_id is null then
    raise exception 'Invalid join code';
  end if;
  
  -- Check if already a member
  if exists (
    select 1 from public.org_members
    where org_members.org_id = target_org_id
      and user_id = auth.uid()
  ) then
    raise exception 'Already a member of this organization';
  end if;
  
  -- Check if there's already a pending request
  select id into request_id
  from public.join_requests
  where org_id = target_org_id
    and user_id = auth.uid()
    and status = 'pending';
  
  -- If pending request exists, update it; otherwise create new one
  if request_id is not null then
    update public.join_requests
    set requested_at = now()
    where id = request_id;
  else
    insert into public.join_requests (org_id, user_id)
    values (target_org_id, auth.uid())
    returning id into request_id;
  end if;
  
  return request_id;
end;
$$;

-- Function: approve_join_request
-- Approve request and add member to organization
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
      reviewed_by = auth.uid()
  where id = request_id;
end;
$$;

-- Function: reject_join_request
-- Reject a join request
create or replace function public.reject_join_request(
  request_id uuid,
  rejection_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
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
  
  -- Check if rejector has permission
  if not public.has_permission(req.org_id, 'join_requests.approve') then
    raise exception 'No permission to manage join requests';
  end if;
  
  -- Update request
  update public.join_requests
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      notes = rejection_notes
  where id = request_id;
end;
$$;

-- Function: create_default_member_role
-- Auto-create "Member" role with view permissions for a new organization
create or replace function public.create_default_member_role(target_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role_id uuid;
  view_permission_ids uuid[];
begin
  -- Create "Member" role
  insert into public.roles (org_id, name, description, is_default)
  values (target_org_id, 'Member', 'Default role with basic view permissions', true)
  returning id into new_role_id;
  
  -- Get all view permissions
  select array_agg(id) into view_permission_ids
  from public.permissions
  where name like '%.view';
  
  -- Assign view permissions to role
  insert into public.role_permissions (role_id, permission_id)
  select new_role_id, unnest(view_permission_ids);
  
  return new_role_id;
end;
$$;

-- Function: Update create_org_with_member
-- Set creator as admin and create default role
drop function if exists public.create_org_with_member(text, text, text);

create or replace function public.create_org_with_member(
  org_name text,
  avatar_emoji text,
  avatar_color text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  resolved_emoji text := coalesce(nullif(avatar_emoji, ''), '🤝');
  resolved_color text := coalesce(nullif(avatar_color, ''), '#f2b5b5');
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Create organization
  insert into public.organizations (name, created_by, join_code, avatar_emoji, avatar_color)
  values (org_name, auth.uid(), public.generate_join_code(), resolved_emoji, resolved_color)
  returning id into new_org_id;

  -- Add creator as admin member (no role needed, is_admin = true gives full permissions)
  insert into public.org_members (org_id, user_id, is_admin)
  values (new_org_id, auth.uid(), true);
  
  -- Create default "Member" role with view permissions
  perform public.create_default_member_role(new_org_id);

  return new_org_id;
end;
$$;

grant execute on function public.create_org_with_member(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 1.6 RLS POLICIES
-- ---------------------------------------------------------------------

-- Enable RLS on new tables
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.join_requests enable row level security;

-- Permissions table: readable by all authenticated users
create policy permissions_select
on public.permissions
for select
to authenticated
using (true);

-- Roles table policies
create policy roles_select
on public.roles
for select
using (public.is_org_member(org_id));

create policy roles_insert
on public.roles
for insert
with check (public.has_permission(org_id, 'roles.create'));

create policy roles_update
on public.roles
for update
using (public.has_permission(org_id, 'roles.edit'))
with check (public.has_permission(org_id, 'roles.edit'));

create policy roles_delete
on public.roles
for delete
using (public.has_permission(org_id, 'roles.delete'));

-- Role_permissions table policies
create policy role_permissions_select
on public.role_permissions
for select
using (
  exists (
    select 1 from public.roles
    where roles.id = role_permissions.role_id
      and public.is_org_member(roles.org_id)
  )
);

create policy role_permissions_insert
on public.role_permissions
for insert
with check (
  exists (
    select 1 from public.roles
    where roles.id = role_permissions.role_id
      and public.has_permission(roles.org_id, 'roles.edit')
  )
);

create policy role_permissions_delete
on public.role_permissions
for delete
using (
  exists (
    select 1 from public.roles
    where roles.id = role_permissions.role_id
      and public.has_permission(roles.org_id, 'roles.edit')
  )
);

-- Join_requests table policies
-- Users can view their own requests
create policy join_requests_select_own
on public.join_requests
for select
using (user_id = auth.uid());

-- Org members with permission can view all requests for their org
create policy join_requests_select_org
on public.join_requests
for select
using (public.has_permission(org_id, 'join_requests.view'));

-- Anyone authenticated can create their own request
create policy join_requests_insert
on public.join_requests
for insert
with check (user_id = auth.uid());

-- Only members with permission can update (approve/reject)
create policy join_requests_update
on public.join_requests
for update
using (public.has_permission(org_id, 'join_requests.approve'))
with check (public.has_permission(org_id, 'join_requests.approve'));

-- ---------------------------------------------------------------------
-- 1.7 GRANT EXECUTE PERMISSIONS
-- ---------------------------------------------------------------------

grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;
grant execute on function public.create_join_request(text) to authenticated;
grant execute on function public.approve_join_request(uuid, uuid) to authenticated;
grant execute on function public.reject_join_request(uuid, text) to authenticated;
grant execute on function public.create_default_member_role(uuid) to authenticated;
