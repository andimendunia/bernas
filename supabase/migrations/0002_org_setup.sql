-- =====================================================================
-- ORGANIZATION SETUP
-- =====================================================================
-- This migration sets up core organization features:
-- - Join code generation and uniqueness
-- - Organization avatar (emoji + color)
-- - Organization creation helper function
-- - Join by code functionality
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. JOIN CODE GENERATOR
-- ---------------------------------------------------------------------

create or replace function public.generate_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  loop
    code :=
      'BERNAS-' || upper(substr(encode(uuid_send(gen_random_uuid()), 'hex'), 1, 6));
    exit when not exists (
      select 1 from public.organizations where join_code = code
    );
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. ADD ORGANIZATION COLUMNS
-- ---------------------------------------------------------------------

-- Add join_code column
alter table public.organizations
add column if not exists join_code text;

-- Populate join codes for existing organizations
update public.organizations
set join_code = public.generate_join_code()
where join_code is null;

-- Make join_code required and unique
alter table public.organizations
alter column join_code set not null;

create unique index if not exists organizations_join_code_key
on public.organizations (join_code);

-- Add avatar columns
alter table public.organizations
add column if not exists avatar_emoji text not null default '🤝',
add column if not exists avatar_color text not null default '#f2b5b5';

-- ---------------------------------------------------------------------
-- 3. ORGANIZATION CREATION FUNCTION
-- ---------------------------------------------------------------------

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

grant execute on function public.create_org_with_member(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. JOIN ORGANIZATION BY CODE FUNCTION
-- ---------------------------------------------------------------------

create or replace function public.join_org_by_code(join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into org_id
  from public.organizations
  where organizations.join_code = join_code;

  if org_id is null then
    raise exception 'Invalid join code';
  end if;

  insert into public.org_members (org_id, user_id)
  values (org_id, auth.uid())
  on conflict do nothing;

  return org_id;
end;
$$;

grant execute on function public.join_org_by_code(text) to authenticated;
