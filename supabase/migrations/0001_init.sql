-- Bernas core schema + RLS
create extension if not exists "pgcrypto";

create type public.org_tier as enum ('free', 'pro');
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.participation_status as enum ('full', 'partial', 'declined');
create type public.resource_type as enum ('gdrive_file', 'gdrive_folder', 'link');
create type public.resource_link_type as enum ('org', 'event', 'task');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier public.org_tier not null default 'free',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table public.event_tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_tag_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  tag_id uuid not null references public.event_tags(id) on delete cascade,
  unique (event_id, tag_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  deadline timestamptz,
  assignee_member_id uuid references public.org_members(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_participations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.org_members(id) on delete cascade,
  status public.participation_status,
  notes text,
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  type public.resource_type not null,
  url text,
  gdrive_id text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resource_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  linked_type public.resource_link_type not null,
  linked_id uuid not null,
  created_at timestamptz not null default now()
);

create index on public.org_members (user_id);
create index on public.events (org_id);
create index on public.tasks (org_id);
create index on public.event_tags (org_id);
create index on public.resources (org_id);
create index on public.resource_links (org_id);
create index on public.event_participations (org_id);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger event_tags_set_updated_at
before update on public.event_tags
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger resources_set_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

create or replace function public.is_org_member(check_org_id uuid)
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
  );
$$;

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.event_tags enable row level security;
alter table public.events enable row level security;
alter table public.event_tag_links enable row level security;
alter table public.tasks enable row level security;
alter table public.event_participations enable row level security;
alter table public.resources enable row level security;
alter table public.resource_links enable row level security;

create policy organizations_select
on public.organizations
for select
using (public.is_org_member(id));

create policy organizations_insert
on public.organizations
for insert
with check ((select auth.uid()) = created_by);

create policy organizations_update
on public.organizations
for update
using (public.is_org_member(id))
with check (public.is_org_member(id));

create policy organizations_delete
on public.organizations
for delete
using (public.is_org_member(id));

create policy org_members_select
on public.org_members
for select
using (public.is_org_member(org_id));

create policy org_members_insert
on public.org_members
for insert
with check (
  (select auth.uid()) = user_id
  or public.is_org_member(org_id)
);

create policy org_members_delete
on public.org_members
for delete
using (public.is_org_member(org_id));

create policy event_tags_select
on public.event_tags
for select
using (public.is_org_member(org_id));

create policy event_tags_insert
on public.event_tags
for insert
with check (public.is_org_member(org_id));

create policy event_tags_update
on public.event_tags
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy event_tags_delete
on public.event_tags
for delete
using (public.is_org_member(org_id));

create policy events_select
on public.events
for select
using (public.is_org_member(org_id));

create policy events_insert
on public.events
for insert
with check (public.is_org_member(org_id));

create policy events_update
on public.events
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy events_delete
on public.events
for delete
using (public.is_org_member(org_id));

create policy event_tag_links_select
on public.event_tag_links
for select
using (public.is_org_member(org_id));

create policy event_tag_links_insert
on public.event_tag_links
for insert
with check (public.is_org_member(org_id));

create policy event_tag_links_delete
on public.event_tag_links
for delete
using (public.is_org_member(org_id));

create policy tasks_select
on public.tasks
for select
using (public.is_org_member(org_id));

create policy tasks_insert
on public.tasks
for insert
with check (public.is_org_member(org_id));

create policy tasks_update
on public.tasks
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy tasks_delete
on public.tasks
for delete
using (public.is_org_member(org_id));

create policy event_participations_select
on public.event_participations
for select
using (public.is_org_member(org_id));

create policy event_participations_insert
on public.event_participations
for insert
with check (public.is_org_member(org_id));

create policy event_participations_update
on public.event_participations
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy event_participations_delete
on public.event_participations
for delete
using (public.is_org_member(org_id));

create policy resources_select
on public.resources
for select
using (public.is_org_member(org_id));

create policy resources_insert
on public.resources
for insert
with check (public.is_org_member(org_id));

create policy resources_update
on public.resources
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy resources_delete
on public.resources
for delete
using (public.is_org_member(org_id));

create policy resource_links_select
on public.resource_links
for select
using (public.is_org_member(org_id));

create policy resource_links_insert
on public.resource_links
for insert
with check (public.is_org_member(org_id));

create policy resource_links_delete
on public.resource_links
for delete
using (public.is_org_member(org_id));
