-- Fix join code generator for Postgres UUID -> bytea
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
