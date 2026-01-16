-- =====================================================================
-- FIX RLS PERFORMANCE ISSUES
-- =====================================================================
-- This migration fixes two types of performance issues:
-- 1. auth_rls_initplan: Wrap auth.uid() in SELECT to prevent re-evaluation per row
-- 2. multiple_permissive_policies: Merge duplicate SELECT policies with OR
-- =====================================================================

-- ---------------------------------------------------------------------
-- FIX 1: organizations_insert policy
-- Replace: auth.uid() = created_by
-- With: (select auth.uid()) = created_by
-- ---------------------------------------------------------------------
drop policy if exists organizations_insert on public.organizations;

create policy organizations_insert
on public.organizations
for insert
with check ((select auth.uid()) = created_by);

-- ---------------------------------------------------------------------
-- FIX 2: org_members_insert policy
-- Replace: auth.uid() = user_id
-- With: (select auth.uid()) = user_id
-- ---------------------------------------------------------------------
drop policy if exists org_members_insert on public.org_members;

create policy org_members_insert
on public.org_members
for insert
with check (
  (select auth.uid()) = user_id
  or public.is_org_member(org_id)
);

-- ---------------------------------------------------------------------
-- FIX 3: join_requests policies
-- - Wrap auth.uid() in SELECT
-- - Merge the two SELECT policies into one with OR
-- ---------------------------------------------------------------------

-- Drop the two separate SELECT policies
drop policy if exists join_requests_select_own on public.join_requests;
drop policy if exists join_requests_select_org on public.join_requests;

-- Create single merged SELECT policy with optimized auth.uid()
create policy join_requests_select
on public.join_requests
for select
using (
  (select auth.uid()) = user_id
  or public.has_permission(org_id, 'join_requests.view')
);

-- Fix INSERT policy
drop policy if exists join_requests_insert on public.join_requests;

create policy join_requests_insert
on public.join_requests
for insert
with check ((select auth.uid()) = user_id);
