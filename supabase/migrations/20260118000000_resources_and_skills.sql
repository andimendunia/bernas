-- =====================================================================
-- RESOURCES AND SKILLS SYSTEM
-- =====================================================================
-- This migration updates the resources system to support:
-- - Description field for resources
-- - Tag-based categorization (same tags as events)
-- - Many-to-many event attachments
-- And adds skills system:
-- - Member skills using universal tag system
-- - Self-assignment with granular permissions
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. UPDATE RESOURCES TABLE
-- ---------------------------------------------------------------------

-- Add description field to resources
alter table public.resources
  add column if not exists description text;

-- Update resource_links to use event_id directly (simpler many-to-many)
-- The existing resource_link_type enum allows 'org', 'event', 'task'
-- We'll use this for event attachments (linked_type = 'event', linked_id = event.id)

-- ---------------------------------------------------------------------
-- 2. RESOURCE TAG LINKS (Many-to-Many)
-- ---------------------------------------------------------------------

-- Resources can be tagged with the same tags as events
create table if not exists public.resource_tag_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id uuid not null references public.event_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (resource_id, tag_id)
);

create index on public.resource_tag_links (org_id);
create index on public.resource_tag_links (resource_id);
create index on public.resource_tag_links (tag_id);

-- ---------------------------------------------------------------------
-- 3. MEMBER SKILLS (Many-to-Many with Tags)
-- ---------------------------------------------------------------------

-- Members can have multiple skills, where skills are tags
create table if not exists public.member_skills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.org_members(id) on delete cascade,
  tag_id uuid not null references public.event_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, tag_id)
);

create index on public.member_skills (org_id);
create index on public.member_skills (member_id);
create index on public.member_skills (tag_id);

-- ---------------------------------------------------------------------
-- 4. PERMISSIONS FOR SKILLS
-- ---------------------------------------------------------------------

-- Add skills permissions to the permissions table
insert into public.permissions (name, description, category) values
  ('skills.assign_self', 'Assign skills to yourself', 'skills'),
  ('skills.assign_others', 'Assign skills to other members', 'skills'),
  ('skills.remove_self', 'Remove skills from yourself', 'skills'),
  ('skills.remove_others', 'Remove skills from other members', 'skills')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 5. RLS POLICIES - RESOURCES
-- ---------------------------------------------------------------------

-- Resources: SELECT (view) - All members can view org resources
drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources
for select using (
  public.is_org_member(org_id)
);

-- Resources: INSERT (create) - Members with permission or own resources
drop policy if exists resources_insert on public.resources;
create policy resources_insert on public.resources
for insert with check (
  public.is_org_member(org_id)
  and (
    public.has_permission(org_id, 'resources.create')
    or (select auth.uid()) = created_by  -- Can create own
  )
);

-- Resources: UPDATE (edit) - Members with permission or own resources
drop policy if exists resources_update on public.resources;
create policy resources_update on public.resources
for update using (
  public.is_org_member(org_id)
  and (
    public.has_permission(org_id, 'resources.edit')
    or (select auth.uid()) = created_by  -- Can edit own
  )
);

-- Resources: DELETE - Members with permission or own resources
drop policy if exists resources_delete on public.resources;
create policy resources_delete on public.resources
for delete using (
  public.is_org_member(org_id)
  and (
    public.has_permission(org_id, 'resources.delete')
    or (select auth.uid()) = created_by  -- Can delete own
  )
);

alter table public.resources enable row level security;

-- ---------------------------------------------------------------------
-- 6. RLS POLICIES - RESOURCE_TAG_LINKS
-- ---------------------------------------------------------------------

drop policy if exists resource_tag_links_select on public.resource_tag_links;
create policy resource_tag_links_select on public.resource_tag_links
for select using (
  public.is_org_member(org_id)
);

drop policy if exists resource_tag_links_insert on public.resource_tag_links;
create policy resource_tag_links_insert on public.resource_tag_links
for insert with check (
  public.is_org_member(org_id)
);

drop policy if exists resource_tag_links_update on public.resource_tag_links;
create policy resource_tag_links_update on public.resource_tag_links
for update using (
  public.is_org_member(org_id)
);

drop policy if exists resource_tag_links_delete on public.resource_tag_links;
create policy resource_tag_links_delete on public.resource_tag_links
for delete using (
  public.is_org_member(org_id)
);

alter table public.resource_tag_links enable row level security;

-- ---------------------------------------------------------------------
-- 7. RLS POLICIES - RESOURCE_LINKS (Event Attachments)
-- ---------------------------------------------------------------------

drop policy if exists resource_links_select on public.resource_links;
create policy resource_links_select on public.resource_links
for select using (
  public.is_org_member(org_id)
);

drop policy if exists resource_links_insert on public.resource_links;
create policy resource_links_insert on public.resource_links
for insert with check (
  public.is_org_member(org_id)
);

drop policy if exists resource_links_update on public.resource_links;
create policy resource_links_update on public.resource_links
for update using (
  public.is_org_member(org_id)
);

drop policy if exists resource_links_delete on public.resource_links;
create policy resource_links_delete on public.resource_links
for delete using (
  public.is_org_member(org_id)
);

alter table public.resource_links enable row level security;

-- ---------------------------------------------------------------------
-- 8. RLS POLICIES - MEMBER_SKILLS
-- ---------------------------------------------------------------------

-- Member Skills: SELECT - All members can view
drop policy if exists member_skills_select on public.member_skills;
create policy member_skills_select on public.member_skills
for select using (
  public.is_org_member(org_id)
);

-- Member Skills: INSERT - Can assign to self, or with permission to assign to others
drop policy if exists member_skills_insert on public.member_skills;
create policy member_skills_insert on public.member_skills
for insert with check (
  public.is_org_member(org_id)
  and (
    -- Check if user is the member being assigned the skill
    exists (
      select 1 from public.org_members om
      where om.id = member_skills.member_id
      and om.user_id = (select auth.uid())
      and public.has_permission(org_id, 'skills.assign_self')
    )
    -- Or has permission to assign to others
    or public.has_permission(org_id, 'skills.assign_others')
  )
);

-- Member Skills: DELETE - Can remove from self, or with permission to remove from others
drop policy if exists member_skills_delete on public.member_skills;
create policy member_skills_delete on public.member_skills
for delete using (
  public.is_org_member(org_id)
  and (
    -- Check if user is the member being removed from
    exists (
      select 1 from public.org_members om
      where om.id = member_skills.member_id
      and om.user_id = (select auth.uid())
      and public.has_permission(org_id, 'skills.remove_self')
    )
    -- Or has permission to remove from others
    or public.has_permission(org_id, 'skills.remove_others')
  )
);

alter table public.member_skills enable row level security;

-- ---------------------------------------------------------------------
-- 9. GRANT PERMISSIONS
-- ---------------------------------------------------------------------

grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.resource_tag_links to authenticated;
grant select, insert, update, delete on public.resource_links to authenticated;
grant select, insert, delete on public.member_skills to authenticated;
