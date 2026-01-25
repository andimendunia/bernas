-- ---------------------------------------------------------------------
-- 1. RESOURCE TAG LINKS
-- ---------------------------------------------------------------------

create table if not exists public.resource_tag_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id uuid not null references public.event_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (resource_id, tag_id)
);

create index if not exists resource_tag_links_org_id_idx on public.resource_tag_links (org_id);
create index if not exists resource_tag_links_resource_id_idx on public.resource_tag_links (resource_id);
create index if not exists resource_tag_links_tag_id_idx on public.resource_tag_links (tag_id);

alter table public.resource_tag_links enable row level security;

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

drop policy if exists resource_tag_links_delete on public.resource_tag_links;
create policy resource_tag_links_delete on public.resource_tag_links
for delete using (
  public.is_org_member(org_id)
);
