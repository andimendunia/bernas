-- Organization avatar fields + updated onboarding RPC
alter table public.organizations
add column if not exists avatar_emoji text not null default '🤝',
add column if not exists avatar_color text not null default '#f2b5b5';

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
  org_id uuid;
  resolved_emoji text := coalesce(nullif(avatar_emoji, ''), '🤝');
  resolved_color text := coalesce(nullif(avatar_color, ''), '#f2b5b5');
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations (name, created_by, join_code, avatar_emoji, avatar_color)
  values (org_name, auth.uid(), public.generate_join_code(), resolved_emoji, resolved_color)
  returning id into org_id;

  insert into public.org_members (org_id, user_id)
  values (org_id, auth.uid())
  on conflict do nothing;

  return org_id;
end;
$$;

create or replace function public.create_org_with_member(org_name text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.create_org_with_member(org_name, '🤝', '#f2b5b5');
$$;

grant execute on function public.create_org_with_member(text, text, text) to authenticated;
