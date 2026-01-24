-- Helper function to get user email by user_id
-- This allows us to display user emails in member lists without exposing auth.users
create or replace function public.get_user_email(user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  select email into user_email
  from auth.users
  where id = user_id;
  
  return user_email;
end;
$$;

grant execute on function public.get_user_email(uuid) to authenticated;
