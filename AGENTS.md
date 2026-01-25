# AGENTS.md

## Project overview
- Bernas: SaaS for LSM/NGO event management and participation intent.
- Stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase.
- Primary color: `#df7f80`.

📚 **For feature specifications, business context, and product roadmap, see [FEATURES.md](./FEATURES.md)**

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
1. `0001_init.sql` - Base schema (organizations, members, events, tasks, tags, participation, resources) with RLS performance optimizations
2. `0002_org_setup.sql` - Organization setup (join codes, avatars, creation function)
3. `0003_roles_permissions.sql` - Roles & permissions system, join requests workflow
4. `0004_user_email_helper.sql` - User email helper function
5. `0005_resources_skills.sql` - Resources and skills system (skills separate from tags)
6. `0006_org_slug.sql` - Organization slug system for URL routing (unique, validated, reserved slug blocking)
7. `0007_user_metadata_trigger.sql` - User app_metadata auto-update trigger, active org management
8. `0008_resources_description.sql` - Resources description column
9. `0009_resource_tag_links.sql` - Resource tagging system (links resources to event_tags)

**Key Tables:**
- `organizations` - Organization data with join codes, avatars, and unique slugs
- `org_members` - Membership records with role assignments
- `roles` - Custom roles per organization
- `permissions` - System-wide permissions (read-only, predefined)
- `role_permissions` - Many-to-many role-permission mappings
- `join_requests` - Organization join request workflow
- `events`, `tasks`, `participation` - Event and task management
- `event_tags` - UPPERCASE tags for categorizing events/resources
- `resources` - Resource library with URLs/files
- `skills` - lowercase skills (separate from tags)
- `member_skills` - Member skill assignments
- `event_skill_links` - Skills required for events
- `task_skill_links` - Skills required for tasks

**RLS:**
- Member-based access via `is_org_member(org_id)` helper
- Permission-based mutations via `has_permission(org_id, permission_name)` RPC
- Admin bypass: Admins automatically have all permissions
- **Performance**: Use `(select auth.uid())` pattern, merge SELECT policies with OR
- See [PATTERNS.md](./PATTERNS.md) for optimization techniques

## Onboarding flow
- **Route**: `/onboarding`
- **Access**: Redirects to `/{last_visited_org_slug}/overview` if already onboarded
- **Workflow**:
  1. User chooses: Create new organization OR Join existing
  2. **Create**: 
     - User enters org name (slug auto-suggested, editable)
     - Slug validated: 3-50 chars, lowercase, hyphens, no reserved words
     - Creates org + member record via `create_org_with_member()` RPC
     - **Database trigger** automatically updates `app_metadata` (onboarded, org_id, active_org_id, last_visited_org_slug)
     - Frontend refreshes session to get updated metadata
     - Redirects to `/{org_slug}/overview`
  3. **Join**: Submits join request via `create_join_request()` RPC, shows dialog confirmation, waits for admin approval
- **Join Request Approval**: Admin approves via `/{org_slug}/administration`, trigger updates user's `app_metadata`
- **App Metadata** (stored in `auth.users.raw_app_meta_data`):
  - `onboarded: true` - Set after joining first organization
  - `org_id` - First organization joined (never changes)
  - `active_org_id` - Currently active organization (updates when switching)
  - `last_visited_org_slug` - For redirect after sign-in (updates when switching)
- **Slug Validation**: Real-time via `check_slug_available()` RPC (checks format, reserved words, uniqueness)
- **IMPORTANT**: Always use `app_metadata` for onboarding/org state, NOT `user_metadata`

## Navigation & Routing
- **URL Structure**: All routes are scoped to organization slug: `/{org_slug}/*`
- Organization layout: `src/app/[orgSlug]/layout.tsx`
- Sidebar: `src/components/app-sidebar.tsx`
- Main nav sections: `src/components/nav-main.tsx` (collapsible menu sections)
- Organization switcher: `src/components/team-switcher.tsx` (preserves feature context when switching)
- Organization menu: `src/components/nav-projects.tsx` (context-aware with active state detection)

**Slug-Based Routes:**
- `/{org_slug}/overview` - Dashboard home
- `/{org_slug}/calendar` - Calendar view
- `/{org_slug}/events` - Events list
- `/{org_slug}/events/[id]` - Event detail page
- `/{org_slug}/events/tags` - Manage event tags
- `/{org_slug}/tasks` - All tasks
- `/{org_slug}/tasks/mine` - My tasks
- `/{org_slug}/resources` - Resource library
- `/{org_slug}/participation` - Event participation
- `/{org_slug}` - Organization info with tabs (Members, Skills, Tags)
- `/{org_slug}/administration` - Admin panel (roles, join requests, danger zone)

**Organization Profile Page Structure:**
```
/{org_slug}
├── Organization Info Panel (persists across tabs)
│   ├── Avatar, Name, Member Count
│   ├── Join Code
│   └── Edit Button
└── Tabs
    ├── Members (members table)
    ├── Skills (skills management)
    └── Tags (tags management)
```

**Breadcrumb Pattern:**
- Use `<DashboardHeader>` component for consistent breadcrumb navigation
- Format: `Organization Name > Section > Page`
- Example: `<DashboardHeader title="Info" sectionHref="/{orgSlug}" sectionLabel={orgName} />`

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

**Organization from Slug Pattern:**
```typescript
const { orgSlug } = await params
const supabase = await createSupabaseServerClient()

const { data: org } = await supabase
  .from("organizations")
  .select("id, name, slug")
  .eq("slug", orgSlug)
  .single()

if (!org) redirect("/onboarding")
```

**Note**: The `[orgSlug]` layout validates org membership before rendering child routes.

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
- Org-context pages use `Page - Organization Name` (e.g., `Info - Panggung Minoritas`)
- Non-org pages use `Page - Bernas`

## Files to know

**Pages:**
- `src/app/page.tsx` - Landing page
- `src/app/onboarding/page.tsx` - Onboarding flow with slug input
- `src/app/[orgSlug]/layout.tsx` - Organization layout (validates slug & membership)
- `src/app/[orgSlug]/page.tsx` - Organization profile with tabs
- `src/app/[orgSlug]/overview/page.tsx` - Dashboard home
- `src/app/[orgSlug]/events/page.tsx` - Events list
- `src/app/[orgSlug]/events/[id]/page.tsx` - Event detail page
- `src/app/[orgSlug]/administration/page.tsx` - Admin panel

**Components:**
- `src/components/ui/*` - shadcn/ui primitives (23 components)
- `src/components/app-sidebar.tsx` - Main application sidebar
- `src/components/nav-*.tsx` - Navigation components (nav-main, nav-projects, nav-user)
- `src/components/organization/organization-info-panel.tsx` - Persistent org info panel
- `src/components/organization/organization-profile.tsx` - Tabbed org profile
- `src/components/organization/organization-info.tsx` - Members table
- `src/components/members/*` - Member management components
- `src/components/administration/*` - Administration panel components
- `src/components/onboarding/slug-input.tsx` - Slug input with real-time validation

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
