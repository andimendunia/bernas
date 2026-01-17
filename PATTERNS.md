# PATTERNS.md

Comprehensive development patterns and best practices for Bernas.

**Quick Start**: Read [AGENTS.md](./AGENTS.md) first for project overview and essential information.

---

## Table of Contents

1. [Component Architecture Patterns](#1-component-architecture-patterns)
2. [Permission & Authorization Patterns](#2-permission--authorization-patterns)
3. [Data Fetching Patterns](#3-data-fetching-patterns)
4. [Form Patterns](#4-form-patterns)
5. [Table & List Patterns](#5-table--list-patterns)
6. [Navigation Patterns](#6-navigation-patterns)
7. [Layout & Spacing Patterns](#7-layout--spacing-patterns)
8. [RLS Patterns & Best Practices](#8-rls-patterns--best-practices)
9. [Migration Conventions](#9-migration-conventions)
10. [Error Handling Patterns](#10-error-handling-patterns)
11. [Type Safety Patterns](#11-type-safety-patterns)

---

## 1. Component Architecture Patterns

### Overview

Bernas uses a three-layer component architecture to separate server-side concerns (data fetching, permissions) from client-side concerns (interactivity, state).

### The Pattern: Server → Wrapper → Client

**Why this exists**: Next.js App Router requires clear separation between server and client components. This pattern maximizes performance while maintaining clean component boundaries.

```typescript
// 1. Server Component (page.tsx)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrganizationInfoPage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  
  // Fetch data server-side
  const members = await getOrgMembers(activeOrgId)
  
  // Check permissions server-side
  const { data: canEdit } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'org.edit_settings'
  })
  
  return <OrganizationInfoWrapper members={members} canEdit={canEdit === true} />
}
```

```typescript
// 2. Client Wrapper (organization-info-wrapper.tsx)
"use client"
import { useRouter } from "next/navigation"

export function OrganizationInfoWrapper(props) {
  const router = useRouter()
  
  const handleUpdate = () => {
    router.refresh()
    setTimeout(() => router.refresh(), 100) // Double-refresh pattern
  }
  
  return <OrganizationInfo {...props} onUpdate={handleUpdate} />
}
```

```typescript
// 3. Client Component (organization-info.tsx)
"use client"

export function OrganizationInfo({ members, canEdit, onUpdate }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  
  const handleAction = async () => {
    // Perform action
    onUpdate() // Trigger refresh
  }
  
  return (
    // UI with dialogs, interactions, state
  )
}
```

### When to Use Force Dynamic

Add to pages that need real-time data or depend on user authentication:

```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

**Use for**: Organization pages, admin panels, member lists, dashboard pages
**Skip for**: Static marketing pages, documentation

### Props Serialization

❌ **Anti-pattern**: Passing non-serializable data
```typescript
// BAD: Passing functions or class instances
<ClientComponent onUpdate={someFunction} />
```

✅ **Correct**: Only serializable data
```typescript
// GOOD: Primitives, plain objects, arrays
<ClientComponent members={members} canEdit={true} />
```

### Double-Refresh Pattern

Always use double-refresh when updating data:

```typescript
const handleUpdate = () => {
  router.refresh()
  setTimeout(() => router.refresh(), 100)
}
```

**Why**: Ensures Supabase cache is cleared and server component re-fetches data.

❌ **Anti-pattern**: Single refresh may miss updates
```typescript
// BAD
router.refresh()
```

---

## 2. Permission & Authorization Patterns

### Overview

Bernas uses a granular role-based permission system where admins bypass all checks and regular members require specific permissions.

### Server-Side Permission Checks (Required)

Always check permissions in server components before rendering:

```typescript
export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const activeOrgId = userData.user?.user_metadata.active_org_id
  
  // Check permission
  const { data: canEdit } = await supabase.rpc('has_permission', {
    check_org_id: activeOrgId,
    permission_name: 'org.edit_settings'
  })
  
  // Compare with === true (RPC can return null/undefined)
  if (canEdit !== true) {
    redirect("/dashboard")
  }
  
  // Pass boolean to client
  return <Component canEdit={canEdit === true} />
}
```

### Admin-Only Pages

For admin-exclusive pages, check admin status first:

```typescript
const { data: isAdmin } = await supabase.rpc('is_org_admin', {
  check_org_id: activeOrgId
})

if (isAdmin !== true) {
  redirect("/dashboard")
}
```

### Permission Naming Convention

Format: `'category.action'`

Examples:
- `'members.remove'`
- `'members.change_role'`
- `'events.create'`
- `'events.edit'`
- `'org.edit_settings'`
- `'roles.manage'`

### Client-Side Permission Helpers

Use helpers from `src/lib/permissions.ts`:

```typescript
import { hasPermission, isOrgAdmin } from "@/lib/permissions"

// In client component
const canDelete = hasPermission(userPermissions, 'events.delete')
const isAdmin = isOrgAdmin(member)
```

### Anti-Patterns

❌ **Anti-pattern**: Client-only permission checks
```typescript
// BAD: Can be bypassed by manipulating client state
"use client"
export default function Page() {
  const canEdit = checkPermission() // Client-side only
  if (!canEdit) return <AccessDenied />
}
```

✅ **Correct**: Always check on server first
```typescript
// GOOD: Server-side check before rendering
export default async function Page() {
  const { data: canEdit } = await supabase.rpc('has_permission', ...)
  if (canEdit !== true) redirect("/dashboard")
}
```

❌ **Anti-pattern**: Not using strict equality
```typescript
// BAD: May incorrectly evaluate null/undefined as truthy
if (canEdit) { ... }
```

✅ **Correct**: Use strict equality
```typescript
// GOOD: Explicitly check for true
if (canEdit === true) { ... }
```

---

## 3. Data Fetching Patterns

### Overview

Data fetching happens exclusively in server components using Supabase client with cookie-based authentication.

### Active Organization Pattern

Standard pattern for getting the user's active organization:

```typescript
const supabase = await createSupabaseServerClient()
const { data: userData } = await supabase.auth.getUser()
const user = userData.user

if (!user) redirect("/auth/sign-in")

const activeOrgId = user.user_metadata.active_org_id

if (!activeOrgId) redirect("/onboarding")

// Fetch organization data
const { data: orgData } = await supabase
  .from("org_members")
  .select("organizations(id, name, join_code, avatar_emoji, avatar_color)")
  .eq("org_id", activeOrgId)
  .eq("user_id", user.id)
  .single()
```

### Using Permission Helper Functions

Prefer helper functions from `src/lib/permissions-server.ts`:

```typescript
import { getOrgMembers, getOrgRoles, getAllPermissions } from "@/lib/permissions-server"

// Get members with user data and roles
const members = await getOrgMembers(activeOrgId)

// Get all roles for organization
const roles = await getOrgRoles(activeOrgId)

// Get all system permissions
const permissions = await getAllPermissions()
```

### Parallel Fetching

Use `Promise.all` for independent queries:

```typescript
const [members, roles, permissions] = await Promise.all([
  getOrgMembers(activeOrgId),
  getOrgRoles(activeOrgId),
  getAllPermissions()
])
```

### Error Handling in Data Fetching

Always provide fallbacks for failed queries:

```typescript
let members = []
let roles = []

try {
  const results = await Promise.all([
    getOrgMembers(activeOrgId),
    getOrgRoles(activeOrgId)
  ])
  members = results[0]
  roles = results[1]
} catch (error) {
  console.error("Failed to fetch data:", error)
  // Continue with empty arrays
}
```

### Anti-Patterns

❌ **Anti-pattern**: Fetching data in client components
```typescript
// BAD: Client-side fetching adds latency and complexity
"use client"
export function Component() {
  const [data, setData] = useState([])
  useEffect(() => {
    fetchData().then(setData)
  }, [])
}
```

✅ **Correct**: Fetch in server component, pass as props
```typescript
// GOOD: Server-side fetch, pass to client
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}
```

❌ **Anti-pattern**: Sequential fetching when parallel is possible
```typescript
// BAD: Queries run one after another
const members = await getOrgMembers(orgId)
const roles = await getOrgRoles(orgId)
const permissions = await getAllPermissions()
```

✅ **Correct**: Parallel fetching
```typescript
// GOOD: All queries run simultaneously
const [members, roles, permissions] = await Promise.all([
  getOrgMembers(orgId),
  getOrgRoles(orgId),
  getAllPermissions()
])
```

---

## 4. Form Patterns

### Overview

Forms in Bernas use shadcn Dialog components with single dialogs handling both create and edit modes.

### Dialog-Based Form Pattern

```typescript
"use client"

export function RoleFormDialog({ open, onOpenChange, role, orgId, onSuccess }) {
  const [name, setName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  
  // Load data when editing
  React.useEffect(() => {
    if (open && role) {
      setName(role.name)
    } else if (open && !role) {
      setName("") // Reset for create
    }
  }, [open, role])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (role) {
        await updateRole(role.id, name)
        toast.success("Role updated")
      } else {
        await createRole(orgId, name)
        toast.success("Role created")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Edit" : "Create"} Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : role ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Form State Management

- **Controlled inputs**: Use React state for all form fields
- **Loading states**: Disable buttons during submission
- **Reset on close**: Clear form when dialog closes
- **Toast feedback**: Always show success/error messages

### Toast Notifications

```typescript
import { toast } from "sonner"

// Success
toast.success("Member removed successfully")

// Error with fallback
toast.error(error.message || "Failed to perform action")
```

### Anti-Patterns

❌ **Anti-pattern**: Separate pages for create/edit
```typescript
// BAD: Duplicate code in separate routes
/organization/roles/new
/organization/roles/[id]/edit
```

✅ **Correct**: Single dialog for both
```typescript
// GOOD: One component, role prop determines mode
<RoleFormDialog role={editingRole} />
```

❌ **Anti-pattern**: No loading states
```typescript
// BAD: Users can't tell if action is processing
<Button onClick={handleSave}>Save</Button>
```

✅ **Correct**: Show loading states
```typescript
// GOOD: Clear feedback during async operations
<Button onClick={handleSave} disabled={loading}>
  {loading ? "Saving..." : "Save"}
</Button>
```

❌ **Anti-pattern**: Silent failures
```typescript
// BAD: No user feedback on errors
try {
  await saveData()
} catch (error) {
  console.error(error) // User sees nothing
}
```

✅ **Correct**: User-facing error messages
```typescript
// GOOD: User knows what happened
try {
  await saveData()
  toast.success("Saved successfully")
} catch (error: any) {
  toast.error(error.message || "Failed to save")
}
```

---

## 5. Table & List Patterns

### Overview

Use TanStack Table for data tables with sorting, filtering, and actions.

### TanStack Table Pattern

```typescript
"use client"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"

export function MembersTable({ members }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  
  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "user",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(row.original)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{getName(row.original)}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
  
  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  })
  
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
```

### Simple List Pattern (Alternative)

For simpler lists without advanced features:

```typescript
<div className="space-y-2">
  {items.map((item) => (
    <div
      key={item.id}
      className="flex items-center justify-between rounded-lg border p-4"
    >
      <div>{item.name}</div>
      <Button onClick={() => handleAction(item)}>Action</Button>
    </div>
  ))}
</div>
```

### Empty States

Always provide feedback when lists are empty:

```typescript
{items.length === 0 && (
  <div className="rounded-lg border border-dashed p-12 text-center">
    <p className="text-sm text-muted-foreground">
      No items found. Create your first item to get started.
    </p>
  </div>
)}
```

### Anti-Patterns

❌ **Anti-pattern**: Building tables manually
```typescript
// BAD: Hard to maintain, no sorting/filtering
<table>
  {members.map(m => <tr><td>{m.name}</td></tr>)}
</table>
```

✅ **Correct**: Use TanStack Table
```typescript
// GOOD: Built-in sorting, filtering, pagination
const table = useReactTable({ data, columns, ... })
```

---

## 6. Navigation Patterns

### Overview

Navigation in Bernas uses consistent breadcrumb patterns with the DashboardHeader component.

### Breadcrumb Implementation

```typescript
import { DashboardHeader } from "@/components/dashboard-header"

// Two-level breadcrumb (Section > Page)
<DashboardHeader
  title="Members"
  sectionHref="/dashboard/organization/info"
  sectionLabel={organization.name}
/>

// Single-level breadcrumb
<DashboardHeader title="Dashboard" />
```

### Page Layout Structure

Standard layout for dashboard pages:

```typescript
export default async function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="..." sectionHref="..." sectionLabel="..." />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Page content */}
      </div>
    </div>
  )
}
```

For centered content (forms, info pages):

```typescript
<div className="flex flex-1 flex-col">
  <DashboardHeader title="..." />
  <div className="flex flex-1 items-start justify-center p-4 pt-0">
    <div className="w-full max-w-5xl">
      {/* Centered content */}
    </div>
  </div>
</div>
```

### Active State Detection

Sidebar items detect active routes automatically:

```typescript
// In nav-projects.tsx
const isActive = pathname.startsWith(item.url)

<SidebarMenuButton isActive={isActive}>
  {item.title}
</SidebarMenuButton>
```

### Anti-Patterns

❌ **Anti-pattern**: Inconsistent breadcrumbs
```typescript
// BAD: Custom breadcrumb in each page
<nav>Dashboard / Organization / Members</nav>
```

✅ **Correct**: Use DashboardHeader consistently
```typescript
// GOOD: Consistent component with proper links
<DashboardHeader title="Members" sectionLabel="Organization" />
```

---

## 7. Layout & Spacing Patterns

### Overview

Bernas uses an open design philosophy with minimal borders and consistent spacing.

### Card Usage

Cards are used **only** for grid items, not main content:

```typescript
// ✅ GOOD: Cards for grid of items
<div className="grid gap-4 md:grid-cols-2">
  {roles.map((role) => (
    <Card key={role.id} className="p-6">
      <h3>{role.name}</h3>
      <p>{role.description}</p>
    </Card>
  ))}
</div>

// ❌ BAD: Card wrapping main content
<Card>
  <CardHeader>
    <CardTitle>Members</CardTitle>
  </CardHeader>
  <CardContent>
    <MembersTable />
  </CardContent>
</Card>
```

### Spacing Conventions

- **Page wrapper**: `p-4 pt-0` (padding on all sides except top)
- **Section gaps**: `gap-4` or `gap-6` for vertical spacing
- **Form fields**: `space-y-2` between label and input
- **Form sections**: `space-y-4` between field groups
- **List items**: `space-y-2` for compact lists

### Content Max-Width

```typescript
// Large content (tables, dashboards)
<div className="w-full max-w-5xl">

// Forms and narrow content
<div className="w-full max-w-2xl">
```

### Responsive Grid

```typescript
// Two columns on medium screens and up
<div className="grid gap-4 md:grid-cols-2">

// Three columns on large screens
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

// Responsive with different column counts
<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
```

### Empty States

```typescript
<div className="rounded-lg border border-dashed p-12 text-center">
  <p className="text-sm text-muted-foreground">
    No items found. Create your first item to get started.
  </p>
</div>
```

### Anti-Patterns

❌ **Anti-pattern**: Inconsistent spacing
```typescript
// BAD: Mixing gap values randomly
<div className="gap-2">
  <div className="gap-5">
    <div className="gap-3">
```

✅ **Correct**: Consistent spacing scale
```typescript
// GOOD: Use gap-4 or gap-6 consistently
<div className="gap-4">
  <div className="gap-4">
```

❌ **Anti-pattern**: Cards everywhere
```typescript
// BAD: Wrapping everything in cards
<Card>
  <Card>
    <Card>Content</Card>
  </Card>
</Card>
```

✅ **Correct**: Cards only for grid items
```typescript
// GOOD: Open design with minimal borders
<div className="space-y-6">
  <div className="grid gap-4 md:grid-cols-2">
    <Card>Item 1</Card>
    <Card>Item 2</Card>
  </div>
</div>
```

---

## 8. RLS Patterns & Best Practices

### Overview

Row Level Security (RLS) policies in Bernas are optimized for performance and security.

### Performance Optimization: Wrap auth.uid()

Always wrap `auth.uid()` in a SELECT to prevent per-row evaluation:

```sql
-- ❌ BAD: auth.uid() evaluated for every row
create policy table_select on public.table_name
for select
using (auth.uid() = user_id);

-- ✅ GOOD: auth.uid() evaluated once
create policy table_select on public.table_name
for select
using ((select auth.uid()) = user_id);
```

### Merge Multiple SELECT Policies

Combine multiple permissive SELECT policies into one with OR:

```sql
-- ❌ BAD: Two separate policies (performance issue)
create policy table_select_own on public.table_name
for select using (user_id = auth.uid());

create policy table_select_org on public.table_name
for select using (public.has_permission(org_id, 'permission.name'));

-- ✅ GOOD: Single merged policy
create policy table_select on public.table_name
for select
using (
  (select auth.uid()) = user_id
  or public.has_permission(org_id, 'permission.name')
);
```

### Standard Policy Structure

```sql
-- SELECT: Members can view
create policy table_select on public.table_name
for select
using (public.is_org_member(org_id));

-- INSERT: Permission-based
create policy table_insert on public.table_name
for insert
with check (public.has_permission(org_id, 'category.create'));

-- UPDATE: Permission-based
create policy table_update on public.table_name
for update
using (public.has_permission(org_id, 'category.edit'))
with check (public.has_permission(org_id, 'category.edit'));

-- DELETE: Permission-based
create policy table_delete on public.table_name
for delete
using (public.has_permission(org_id, 'category.delete'));
```

### Function Security

```sql
create or replace function public.function_name(param type)
returns return_type
language plpgsql
security definer          -- Required for auth.uid() access
set search_path = public  -- Prevent search_path attacks
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Function logic
  
  return result;
end;
$$;

-- Always grant execute
grant execute on function public.function_name(type) to authenticated;
```

### Anti-Patterns

❌ **Anti-pattern**: Bare auth.uid() in policies
```sql
-- BAD: Performance issue
using (auth.uid() = user_id)
```

✅ **Correct**: Wrapped auth.uid()
```sql
-- GOOD: Evaluated once
using ((select auth.uid()) = user_id)
```

❌ **Anti-pattern**: Multiple SELECT policies
```sql
-- BAD: Multiple policies checked per query
create policy table_select_1 on table_name for select using (...);
create policy table_select_2 on table_name for select using (...);
```

✅ **Correct**: Single merged policy
```sql
-- GOOD: One policy with OR
create policy table_select on table_name
for select using (condition1 or condition2);
```

❌ **Anti-pattern**: Functions without security settings
```sql
-- BAD: Vulnerable to attacks
create function public.my_func()
language plpgsql
as $$ ... $$;
```

✅ **Correct**: Secure function definition
```sql
-- GOOD: Protected against search_path hijacking
create function public.my_func()
language plpgsql
security definer
set search_path = public
as $$ ... $$;
```

---

## 9. Migration Conventions

### Overview

Database migrations follow consistent structure for readability and maintainability.

### Migration File Structure

```sql
-- =====================================================================
-- DESCRIPTIVE TITLE IN CAPS
-- =====================================================================
-- Purpose: Brief description of what this migration does
-- Author: Name (optional)
-- Date: YYYY-MM-DD (optional)
-- =====================================================================

-- ---------------------------------------------------------------------
-- SECTION 1: CREATE TABLES
-- ---------------------------------------------------------------------

create table public.table_name (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes
create index on public.table_name (org_id);
create index on public.table_name (name);

-- Create trigger
create trigger table_name_set_updated_at
before update on public.table_name
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- SECTION 2: CREATE FUNCTIONS
-- ---------------------------------------------------------------------

create or replace function public.function_name()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Function body
end;
$$;

grant execute on function public.function_name() to authenticated;

-- ---------------------------------------------------------------------
-- SECTION 3: RLS POLICIES
-- ---------------------------------------------------------------------

alter table public.table_name enable row level security;

create policy table_name_select on public.table_name
for select
using (public.is_org_member(org_id));
```

### Index Creation

Always create indexes on:
- Foreign keys
- Columns used in WHERE clauses
- Columns used in JOIN conditions

```sql
-- Single column indexes
create index on public.table_name (org_id);
create index on public.table_name (user_id);

-- Composite indexes for common queries
create index on public.table_name (org_id, status);

-- Partial unique indexes
create unique index table_name_unique
on public.table_name (org_id, user_id)
where status = 'active';
```

### Trigger Pattern

Use `set_updated_at()` for all tables with `updated_at` columns:

```sql
create trigger table_name_set_updated_at
before update on public.table_name
for each row execute function public.set_updated_at();
```

### Function Grants

Always grant execute permissions:

```sql
grant execute on function public.function_name() to authenticated;
grant execute on function public.function_name(uuid, text) to authenticated;
```

### Anti-Patterns

❌ **Anti-pattern**: Missing indexes on foreign keys
```sql
-- BAD: No index on frequently joined column
create table public.events (
  org_id uuid references organizations(id)
);
```

✅ **Correct**: Always index foreign keys
```sql
-- GOOD: Index for joins
create table public.events (
  org_id uuid references organizations(id)
);
create index on public.events (org_id);
```

❌ **Anti-pattern**: Functions without grants
```sql
-- BAD: Function exists but users can't call it
create function public.my_func() ...;
```

✅ **Correct**: Grant permissions
```sql
-- GOOD: Users can execute function
create function public.my_func() ...;
grant execute on function public.my_func() to authenticated;
```

---

## 10. Error Handling Patterns

### Overview

Errors in Bernas are handled gracefully with user-friendly feedback via toast notifications.

### Client-Side Error Handling

```typescript
import { toast } from "sonner"

try {
  await performAction()
  toast.success("Action completed successfully")
  onSuccess()
} catch (error: any) {
  toast.error(error.message || "Failed to perform action")
}
```

### Server-Side Error Handling

```typescript
let data = []
try {
  data = await fetchData()
} catch (error) {
  console.error("Failed to fetch data:", error)
  // Continue with empty array
}
```

### SQL Function Error Handling

```sql
begin
  -- Check authentication
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Check permissions
  if not public.has_permission(org_id, 'permission.name') then
    raise exception 'No permission to perform this action';
  end if;
  
  -- Validate input
  if target_id is null then
    raise exception 'Invalid input: target_id cannot be null';
  end if;
  
  -- Perform action
end;
```

### User-Friendly Error Messages

Always provide context in error messages:

```typescript
// ❌ BAD: Generic message
toast.error("Error")

// ✅ GOOD: Specific message
toast.error("Failed to remove member. Please try again.")

// ✅ BETTER: Include error details when available
toast.error(error.message || "Failed to remove member")
```

### Anti-Patterns

❌ **Anti-pattern**: Silent failures
```typescript
// BAD: User sees nothing
try {
  await action()
} catch (error) {
  console.error(error)
}
```

✅ **Correct**: User feedback
```typescript
// GOOD: User knows what happened
try {
  await action()
  toast.success("Success")
} catch (error: any) {
  toast.error(error.message || "Failed")
}
```

❌ **Anti-pattern**: Generic error messages
```typescript
// BAD: Not helpful to user
toast.error("An error occurred")
```

✅ **Correct**: Specific messages
```typescript
// GOOD: Clear about what failed
toast.error("Failed to update role permissions")
```

---

## 11. Type Safety Patterns

### Overview

TypeScript types ensure type safety across the application.

### Type Definitions Location

Define types in `src/lib/permissions.ts` for client-side use:

```typescript
export type Member = {
  id: string
  org_id: string
  user_id: string
  is_admin: boolean
  role_id: string | null
  created_at: string
  user: {
    email: string
    user_metadata: {
      full_name?: string
      name?: string
      avatar_url?: string
      picture?: string
    }
  }
  role: Role | null
}

export type Role = {
  id: string
  org_id: string
  name: string
  description: string | null
  is_default: boolean
}
```

### User Metadata Extraction

Helper functions for extracting user information:

```typescript
const getUserName = (member: Member) => {
  return (
    member.user.user_metadata.full_name ||
    member.user.user_metadata.name ||
    member.user.email.split('@')[0]
  )
}

const getUserInitials = (member: Member) => {
  const name = getUserName(member)
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
```

### Props Typing

Always type component props:

```typescript
type ComponentProps = {
  member: Member
  canEdit: boolean
  onSuccess: () => void
}

export function Component({ member, canEdit, onSuccess }: ComponentProps) {
  // Implementation
}
```

### Database Type Inference

Use Supabase's generated types when available:

```typescript
import type { Database } from "@/types/supabase"

type Organization = Database['public']['Tables']['organizations']['Row']
```

### Anti-Patterns

❌ **Anti-pattern**: Using `any` unnecessarily
```typescript
// BAD: Loses type safety
const member: any = getMember()
```

✅ **Correct**: Use proper types
```typescript
// GOOD: Type-safe
const member: Member = getMember()
```

❌ **Anti-pattern**: Not typing component props
```typescript
// BAD: No type safety
export function Component({ data, onUpdate }) {
```

✅ **Correct**: Type all props
```typescript
// GOOD: Props are type-safe
type Props = { data: Data[]; onUpdate: () => void }
export function Component({ data, onUpdate }: Props) {
```

---

## Summary

These patterns ensure consistency, maintainability, and performance across the Bernas codebase. When implementing new features:

1. ✅ Follow the **Server → Wrapper → Client** component pattern
2. ✅ Always check **permissions server-side** before rendering
3. ✅ Use **helper functions** from `permissions-server.ts` for data fetching
4. ✅ Implement forms as **Dialog components** with toast feedback
5. ✅ Use **TanStack Table** for data tables
6. ✅ Maintain **consistent spacing** and layout patterns
7. ✅ Optimize **RLS policies** with wrapped auth.uid() and merged SELECT
8. ✅ Follow **migration conventions** with proper structure and indexes
9. ✅ Provide **user-friendly error messages** via toast notifications
10. ✅ Use **TypeScript types** for all components and data structures

For quick reference, see [AGENTS.md](./AGENTS.md).
