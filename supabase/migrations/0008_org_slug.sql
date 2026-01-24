-- =====================================================================
-- ORGANIZATION SLUG SYSTEM
-- =====================================================================
-- This migration adds slug-based routing for organizations
-- Slugs are used in URLs: bernas.app/[slug]/events instead of /dashboard/events
-- 
-- Features:
-- - Slug column with uniqueness constraint
-- - Auto-generation from org name for existing orgs
-- - Format validation (lowercase-with-hyphens, 3-50 chars)
-- - Reserved slug blocking
-- - Slug availability checker RPC
-- - Updated create_org_with_member to include slug

-- ---------------------------------------------------------------------
-- 1. ADD SLUG COLUMN
-- ---------------------------------------------------------------------

-- Add slug column (nullable initially for migration)
alter table public.organizations
  add column slug text;

-- ---------------------------------------------------------------------
-- 2. SLUG GENERATION HELPER FUNCTION
-- ---------------------------------------------------------------------

-- Function to generate URL-friendly slug from organization name
create or replace function public.generate_slug_from_name(org_name text)
returns text
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 1;
begin
  -- Convert to lowercase and replace non-alphanumeric chars with hyphens
  base_slug := lower(regexp_replace(org_name, '[^a-z0-9]+', '-', 'g'));
  
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Limit to 50 characters
  base_slug := substring(base_slug from 1 for 50);
  
  -- Remove trailing hyphen if truncation created one
  base_slug := regexp_replace(base_slug, '-+$', '');
  
  -- Ensure minimum 3 characters
  if length(base_slug) < 3 then
    base_slug := base_slug || '-org';
  end if;
  
  final_slug := base_slug;
  
  -- Check uniqueness, append number if slug already exists
  while exists (select 1 from public.organizations where slug = final_slug) loop
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  end loop;
  
  return final_slug;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. GENERATE SLUGS FOR EXISTING ORGANIZATIONS
-- ---------------------------------------------------------------------

-- Auto-generate slugs for all existing organizations
update public.organizations
set slug = public.generate_slug_from_name(name)
where slug is null;

-- ---------------------------------------------------------------------
-- 4. ADD CONSTRAINTS AND INDEXES
-- ---------------------------------------------------------------------

-- Make slug required
alter table public.organizations
  alter column slug set not null;

-- Add unique constraint
alter table public.organizations
  add constraint organizations_slug_unique unique (slug);

-- Add format validation constraint
-- Format: lowercase letters, numbers, hyphens (no consecutive hyphens)
-- Length: 3-50 characters
alter table public.organizations
  add constraint organizations_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and length(slug) >= 3
    and length(slug) <= 50
  );

-- Add reserved slug constraint
-- Block common/system slugs from being used
alter table public.organizations
  add constraint organizations_slug_not_reserved check (
    slug not in (
      'api',
      'auth',
      'onboarding',
      'admin',
      'dashboard',
      'settings',
      '_next',
      'o',
      'overview',
      'calendar',
      'events',
      'tasks',
      'resources',
      'participation',
      'administration',
      'public',
      'static',
      'assets'
    )
  );

-- Create index for fast slug lookup
create index organizations_slug_idx on public.organizations(slug);

-- ---------------------------------------------------------------------
-- 5. SLUG AVAILABILITY CHECKER RPC
-- ---------------------------------------------------------------------

-- Function to check if a slug is available for use
-- Used by onboarding form for real-time validation
create or replace function public.check_slug_available(check_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check format first
  if not (
    check_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and length(check_slug) >= 3
    and length(check_slug) <= 50
  ) then
    return false;
  end if;
  
  -- Check if reserved
  if check_slug in (
    'api', 'auth', 'onboarding', 'admin', 'dashboard', 'settings',
    '_next', 'o', 'overview', 'calendar', 'events', 'tasks',
    'resources', 'participation', 'administration', 'public',
    'static', 'assets'
  ) then
    return false;
  end if;
  
  -- Check if already taken
  return not exists (
    select 1 from public.organizations where slug = check_slug
  );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.check_slug_available to authenticated;

-- ---------------------------------------------------------------------
-- 6. UPDATE CREATE_ORG_WITH_MEMBER FUNCTION
-- ---------------------------------------------------------------------

-- Update the organization creation function to include slug
create or replace function public.create_org_with_member(
  org_name text,
  org_slug text,
  org_emoji text default '🤝',
  org_color text default '#f2b5b5'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_member_id uuid;
  default_role_id uuid;
begin
  -- Validate slug format
  if not (
    org_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and length(org_slug) >= 3
    and length(org_slug) <= 50
  ) then
    raise exception 'Invalid slug format';
  end if;
  
  -- Check if slug is reserved
  if org_slug in (
    'api', 'auth', 'onboarding', 'admin', 'dashboard', 'settings',
    '_next', 'o', 'overview', 'calendar', 'events', 'tasks',
    'resources', 'participation', 'administration', 'public',
    'static', 'assets'
  ) then
    raise exception 'Slug is reserved';
  end if;
  
  -- Check if slug is already taken
  if exists (select 1 from organizations where slug = org_slug) then
    raise exception 'Slug already taken';
  end if;

  -- Create organization with slug
  insert into organizations (name, slug, avatar_emoji, avatar_color, created_by)
  values (org_name, org_slug, org_emoji, org_color, (select auth.uid()))
  returning id into new_org_id;

  -- Create admin role for this organization
  insert into roles (org_id, name, description, is_admin, is_default)
  values (
    new_org_id,
    'Admin',
    'Organization administrator with full permissions',
    true,
    false
  );

  -- Create default member role
  insert into roles (org_id, name, description, is_admin, is_default)
  values (
    new_org_id,
    'Member',
    'Default role for organization members',
    false,
    true
  )
  returning id into default_role_id;

  -- Add creator as admin member (no role assignment, is_admin = true)
  insert into org_members (org_id, user_id, is_admin, role_id)
  values (new_org_id, (select auth.uid()), true, null)
  returning id into new_member_id;

  -- Note: User metadata (onboarded, active_org_id, last_visited_org_slug) 
  -- should be updated by the application layer after this function returns

  return new_org_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.create_org_with_member(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 7. HELPER FUNCTION TO GET ORG BY SLUG
-- ---------------------------------------------------------------------

-- Function to get organization ID by slug
-- Used for slug-based routing
create or replace function public.get_org_id_by_slug(org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
begin
  select id into org_id
  from organizations
  where slug = org_slug;
  
  return org_id;
end;
$$;

grant execute on function public.get_org_id_by_slug to authenticated;
