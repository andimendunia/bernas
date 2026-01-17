# AGENTS.md

## Project overview
- Bernas: SaaS for LSM/NGO event management and participation intent.
- Stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase.
- Primary color: `#df7f80`.

## Stack & dependencies
- **Core**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (Auth, Database, Storage)
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **Key Libraries**:
  - `@tanstack/react-table` - Data tables with sorting/filtering
  - `sonner` - Toast notifications
  - `next-intl` - Internationalization (i18n)
  - `lucide-react` - Icon library
  - `next-themes` - Theme management
- **shadcn/ui Components**: Alert Dialog, Avatar, Badge, Button, Card, Checkbox, Collapsible, Dialog, Dropdown Menu, Input, Label, Popover, Select, Separator, Sheet, Sidebar, Skeleton, Table, Tabs, Textarea, Tooltip

## Local dev quickstart
- App: `npm run dev` (http://localhost:3000)
- Supabase local:
  - Start: `npx supabase@latest start`
  - Stop: `npx supabase@latest stop`
  - Reset DB (applies migrations): `npx supabase@latest db reset`
- Supabase Studio: http://127.0.0.1:54323
- Mailpit (local email): http://127.0.0.1:54324

## Environment variables (local)
- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<local publishable key from supabase start output>`

## Auth flow
- Sign-in: `/auth/sign-in` (Google OAuth in hosted; magic link in local).
- Callback: `/auth/callback`
- Sign-out: `/auth/sign-out`
- Local magic link: use Mailpit to open the email.

## Supabase schema + RLS

**Migrations (in order):**
1. `0001_init.sql` - Base schema (organizations, members, events, tasks, tags, participation, resources)
2. `0002_org_onboarding.sql` - Onboarding helper functions
3. `0003_fix_join_code.sql` - Join code unique constraint fix
4. `0004_org_avatar.sql` - Organization avatar (emoji + color)
5. `0005_roles_permissions.sql` - Roles & permissions system, join requests workflow
6. `0006_user_email_helper.sql` - User email helper function
7. `20260116192146_fix_set_updated_at_search_path.sql` - Security fix for set_updated_at trigger
8. `20260116192457_fix_rls_performance.sql` - RLS performance optimization (auth.uid wrapping)
9. `20260116200052_fix_approve_join_request_onboarding.sql` - Fix onboarding metadata on join approval

**Key Tables:**
- `organizations` - Organization data with join codes and avatars
- `org_members` - Membership records with role assignments
- `roles` - Custom roles per organization
- `permissions` - System-wide permissions (read-only, predefined)
- `role_permissions` - Many-to-many role-permission mappings
- `join_requests` - Organization join request workflow
- `events`, `tasks`, `tags`, `participation`, `resources` - Core feature tables

**RLS:**
- Member-based access via `is_org_member(org_id)` helper
- Permission-based mutations via `has_permission(org_id, permission_name)` RPC
- Admin bypass: Admins automatically have all permissions
- **Performance**: Use `(select auth.uid())` pattern, merge SELECT policies with OR
- See [PATTERNS.md](./PATTERNS.md) for optimization techniques

## Onboarding flow
- **Route**: `/onboarding`
- **Access**: Redirects to `/dashboard` if already onboarded
- **Workflow**:
  1. User chooses: Create new organization OR Join existing
  2. **Create**: Directly creates org + member record, sets user metadata
  3. **Join**: Submits join request, shows dialog confirmation, waits for admin approval
- **Join Request Approval**: Admin approves via `/dashboard/organization/administration` tab
- **User Metadata**: Sets `onboarded: true`, `org_id`, `active_org_id` after creation/approval
- **Dashboard Access**: Requires `user_metadata.onboarded === true`

## Navigation
- Dashboard wrapper: `src/app/dashboard/layout.tsx`
- Sidebar: `src/components/app-sidebar.tsx`
- Main nav sections: `src/components/nav-main.tsx` (collapsible menu sections)
- Organization switcher: `src/components/team-switcher.tsx`
- Organization menu: `src/components/nav-projects.tsx` (context-aware with active state detection)

**Organization Routes:**
- `/dashboard/organization/info` - Organization info + members table
- `/dashboard/organization/info/edit` - Edit organization details
- `/dashboard/organization/administration` - Admin panel (roles, join requests, danger zone)
- `/dashboard/organization/members` - Legacy members page (not in sidebar)

**Breadcrumb Pattern:**
- Use `<DashboardHeader>` component for consistent breadcrumb navigation
- Format: `Organization Name > Section > Page`
- Example: `<DashboardHeader title="Members" sectionHref="/dashboard/organization/info" sectionLabel={orgName} />`

## Permission system
Quick reference (detailed in [PATTERNS.md](./PATTERNS.md)):

**Checking Permissions:**
- **Server (permission)**: `await supabase.rpc('has_permission', { check_org_id, permission_name })`
- **Server (admin)**: `await supabase.rpc('is_org_admin', { check_org_id })`
- **Client**: Use helpers from `src/lib/permissions.ts`

**Permission Format**: `'category.action'` (e.g., `'members.remove'`, `'events.create'`)

**Key Rules:**
- Admins bypass all permission checks
- Always check permissions in server component BEFORE rendering
- Compare RPC results with `=== true` (can return null/undefined)
- One default role per org (auto-assigned to new members)

→ See [PATTERNS.md](./PATTERNS.md) for implementation details

## Component architecture
Quick reference (detailed in [PATTERNS.md](./PATTERNS.md)):

**Pattern**: Server Component → Client Wrapper → Client Component

```typescript
// page.tsx (Server) - Fetch data, check permissions
export const dynamic = 'force-dynamic'
export default async function Page() {
  const data = await fetchData()
  return <ComponentWrapper data={data} />
}

// component-wrapper.tsx (Client) - Handle router.refresh()
"use client"
export function ComponentWrapper(props) {
  const router = useRouter()
  const handleUpdate = () => {
    router.refresh()
    setTimeout(() => router.refresh(), 100)
  }
  return <Component {...props} onUpdate={handleUpdate} />
}

// component.tsx (Client) - UI logic, dialogs, state
"use client"
export function Component({ data, onUpdate }) {
  // Handle interactions
}
```

**Key Rules:**
- Add `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` to pages needing real-time data
- Use double-refresh pattern: `router.refresh()` + `setTimeout(() => router.refresh(), 100)`
- Only pass serializable props from server to client components

→ See [PATTERNS.md](./PATTERNS.md) for full examples

## Data fetching
Quick reference (detailed in [PATTERNS.md](./PATTERNS.md)):

**Active Organization Pattern:**
```typescript
const { data: userData } = await supabase.auth.getUser()
const activeOrgId = userData.user?.user_metadata.active_org_id
if (!activeOrgId) redirect("/onboarding")
```

**Permission Helpers**: Use functions from `src/lib/permissions-server.ts`
- `getOrgMembers(orgId)` - Get members with user data and roles
- `getOrgRoles(orgId)` - Get all roles for organization
- `getAllPermissions()` - Get all system permissions

**Parallel Fetching**: Use `Promise.all` for independent queries
```typescript
const [members, roles, permissions] = await Promise.all([
  getOrgMembers(orgId),
  getOrgRoles(orgId),
  getAllPermissions()
])
```

→ See [PATTERNS.md](./PATTERNS.md) for implementation details

## UI conventions
- **Components**: Use shadcn/ui components (Radix UI primitives)
- **Layout**: sidebar-07 pattern in `/dashboard`
- **Design Philosophy**: Open design, minimal borders - no cards for main content (use cards only for grid items)
- **Spacing**: `p-4 pt-0` for page wrappers, `gap-4` or `gap-6` for section spacing
- **Tables**: Use TanStack Table (`@tanstack/react-table`) for data tables
- **Forms**: Dialog-based forms with toast notifications (sonner)
- **Responsive**: Mobile-first with Tailwind breakpoints (md:, lg:, etc.)
- **Content Width**: `max-w-5xl` for large content, `max-w-2xl` for forms
- **i18n**: next-intl ready (English only currently)
- **Tabs**: Custom active styles on `/onboarding` page

→ See [PATTERNS.md](./PATTERNS.md) for detailed guidelines

## RLS & migration best practices
Quick reference (detailed in [PATTERNS.md](./PATTERNS.md)):

**RLS Performance:**
```sql
-- ✅ GOOD: Wrap auth.uid() to prevent per-row evaluation
using ((select auth.uid()) = user_id)

-- ✅ GOOD: Merge multiple SELECT policies with OR
create policy table_select on table_name
for select using (
  (select auth.uid()) = user_id
  or public.has_permission(org_id, 'permission.name')
);
```

**Functions:**
```sql
create or replace function public.function_name()
returns type
language plpgsql
security definer          -- Required for auth.uid() access
set search_path = public  -- Prevent search_path attacks
as $$
begin
  -- Function body
end;
$$;
```

**Migrations:**
- Use descriptive section headers with dashes
- Always create indexes on foreign keys
- Use `set_updated_at()` trigger for updated_at columns
- Grant execute permissions on functions to authenticated users

→ See [PATTERNS.md](./PATTERNS.md) for detailed conventions

## Page titles
- Org-context pages use `Page - Organization Name` (e.g., `Members - Panggung Minoritas`)
- Non-org pages use `Page - Bernas`

## Files to know

**Pages:**
- `src/app/page.tsx` - Landing page
- `src/app/dashboard/page.tsx` - Dashboard home
- `src/app/onboarding/page.tsx` - Onboarding flow
- `src/app/dashboard/organization/info/page.tsx` - Organization info + members table
- `src/app/dashboard/organization/administration/page.tsx` - Admin panel

**Components:**
- `src/components/ui/*` - shadcn/ui primitives (23 components)
- `src/components/app-sidebar.tsx` - Main application sidebar
- `src/components/nav-*.tsx` - Navigation components (nav-main, nav-projects, nav-user)
- `src/components/organization/*` - Organization-related components
- `src/components/members/*` - Member management components
- `src/components/administration/*` - Administration panel components

**Libraries:**
- `src/lib/supabase/client.ts` - Client-side Supabase instance
- `src/lib/supabase/server.ts` - Server-side Supabase instance (with cookies)
- `src/lib/permissions.ts` - Client-side permission helpers and types
- `src/lib/permissions-server.ts` - Server-side permission helper functions
- `src/lib/utils.ts` - Utility functions (cn for className merging, etc.)

**Migrations:**
- `supabase/migrations/` - All database migrations (apply in order with `db reset`)

---

📚 **For detailed implementation patterns, code examples, and best practices, see [PATTERNS.md](./PATTERNS.md)**
