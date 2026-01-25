-- ---------------------------------------------------------------------
-- 1. RESOURCES DESCRIPTION
-- ---------------------------------------------------------------------

alter table public.resources
add column if not exists description text;
