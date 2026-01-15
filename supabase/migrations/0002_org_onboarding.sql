-- Organization join code + onboarding helpers
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
    code := 'BERNAS-' || upper(substr(encode(gen_random_uuid()::bytea, 'hex'), 1, 6));
    exit when not exists (
      select 1 from public.organizations where join_code = code
    );
  end loop;
  return code;
end;
$$;

alter table public.organizations
add column if not exists join_code text;

update public.organizations
set join_code = public.generate_join_code()
where join_code is null;

alter table public.organizations
alter column join_code set not null;

create unique index if not exists organizations_join_code_key
on public.organizations (join_code);

create or replace function public.create_org_with_member(org_name text)
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

  insert into public.organizations (name, created_by, join_code)
  values (org_name, auth.uid(), public.generate_join_code())
  returning id into org_id;

  insert into public.org_members (org_id, user_id)
  values (org_id, auth.uid())
  on conflict do nothing;

  return org_id;
end;
$$;

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

grant execute on function public.create_org_with_member(text) to authenticated;
grant execute on function public.join_org_by_code(text) to authenticated;
