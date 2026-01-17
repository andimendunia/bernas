-- =====================================================================
-- SEPARATE SKILLS FROM TAGS
-- =====================================================================
-- This migration separates skills from tags:
-- - Tags: UPPERCASE, for categorizing events/resources
-- - Skills: lowercase, for matching people to work (events/tasks)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DROP OLD MEMBER_SKILLS TABLE (was using tags)
-- ---------------------------------------------------------------------

drop table if exists public.member_skills cascade;

-- Remove old skills permissions
delete from public.permissions where category = 'skills';

-- ---------------------------------------------------------------------
-- 2. CREATE SKILLS TABLE (separate from tags)
-- ---------------------------------------------------------------------

-- Skills table: Independent skill definitions
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (name ~ '^[a-z][a-z0-9-]*$'), -- lowercase, no spaces, can have hyphens
  description text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index on public.skills (org_id);

create trigger skills_set_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. MEMBER SKILLS (Many-to-Many with Skills)
-- ---------------------------------------------------------------------

-- Members can have multiple skills
create table public.member_skills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  member_id uuid not null references public.org_members(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, skill_id)
);

create index on public.member_skills (org_id);
create index on public.member_skills (member_id);
create index on public.member_skills (skill_id);

-- ---------------------------------------------------------------------
-- 4. EVENT SKILLS (Many-to-Many - events can require skills)
-- ---------------------------------------------------------------------

create table public.event_skill_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, skill_id)
);

create index on public.event_skill_links (org_id);
create index on public.event_skill_links (event_id);
create index on public.event_skill_links (skill_id);

-- ---------------------------------------------------------------------
-- 5. TASK SKILLS (Many-to-Many - tasks can require skills)
-- ---------------------------------------------------------------------

create table public.task_skill_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, skill_id)
);

create index on public.task_skill_links (org_id);
create index on public.task_skill_links (task_id);
create index on public.task_skill_links (skill_id);

-- ---------------------------------------------------------------------
-- 6. PERMISSIONS FOR SKILLS
-- ---------------------------------------------------------------------

insert into public.permissions (name, description, category) values
  ('skills.view', 'View skills', 'skills'),
  ('skills.create', 'Create new skills', 'skills'),
  ('skills.edit', 'Edit existing skills', 'skills'),
  ('skills.delete', 'Delete skills', 'skills'),
  ('skills.assign_self', 'Assign skills to yourself', 'skills'),
  ('skills.assign_others', 'Assign skills to other members', 'skills'),
  ('skills.remove_self', 'Remove skills from yourself', 'skills'),
  ('skills.remove_others', 'Remove skills from other members', 'skills')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 7. RLS POLICIES - SKILLS
-- ---------------------------------------------------------------------

-- Skills: SELECT (view) - All members can view org skills
drop policy if exists skills_select on public.skills;
create policy skills_select on public.skills
for select using (
  public.is_org_member(org_id)
);

-- Skills: INSERT (create) - All members can create skills
drop policy if exists skills_insert on public.skills;
create policy skills_insert on public.skills
for insert with check (
  public.is_org_member(org_id)
);

-- Skills: UPDATE (edit) - Members with permission
drop policy if exists skills_update on public.skills;
create policy skills_update on public.skills
for update using (
  public.is_org_member(org_id)
  and public.has_permission(org_id, 'skills.edit')
);

-- Skills: DELETE - Members with permission
drop policy if exists skills_delete on public.skills;
create policy skills_delete on public.skills
for delete using (
  public.is_org_member(org_id)
  and public.has_permission(org_id, 'skills.delete')
);

alter table public.skills enable row level security;

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
    )
    -- Or has permission to remove from others
    or public.has_permission(org_id, 'skills.remove_others')
  )
);

alter table public.member_skills enable row level security;

-- ---------------------------------------------------------------------
-- 9. RLS POLICIES - EVENT_SKILL_LINKS
-- ---------------------------------------------------------------------

drop policy if exists event_skill_links_select on public.event_skill_links;
create policy event_skill_links_select on public.event_skill_links
for select using (
  public.is_org_member(org_id)
);

drop policy if exists event_skill_links_insert on public.event_skill_links;
create policy event_skill_links_insert on public.event_skill_links
for insert with check (
  public.is_org_member(org_id)
);

drop policy if exists event_skill_links_delete on public.event_skill_links;
create policy event_skill_links_delete on public.event_skill_links
for delete using (
  public.is_org_member(org_id)
);

alter table public.event_skill_links enable row level security;

-- ---------------------------------------------------------------------
-- 10. RLS POLICIES - TASK_SKILL_LINKS
-- ---------------------------------------------------------------------

drop policy if exists task_skill_links_select on public.task_skill_links;
create policy task_skill_links_select on public.task_skill_links
for select using (
  public.is_org_member(org_id)
);

drop policy if exists task_skill_links_insert on public.task_skill_links;
create policy task_skill_links_insert on public.task_skill_links
for insert with check (
  public.is_org_member(org_id)
);

drop policy if exists task_skill_links_delete on public.task_skill_links;
create policy task_skill_links_delete on public.task_skill_links
for delete using (
  public.is_org_member(org_id)
);

alter table public.task_skill_links enable row level security;

-- ---------------------------------------------------------------------
-- 11. GRANT PERMISSIONS
-- ---------------------------------------------------------------------

grant select, insert, update, delete on public.skills to authenticated;
grant select, insert, delete on public.member_skills to authenticated;
grant select, insert, delete on public.event_skill_links to authenticated;
grant select, insert, delete on public.task_skill_links to authenticated;
