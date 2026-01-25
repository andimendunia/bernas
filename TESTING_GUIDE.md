# 🧪 Bernas Testing Guide

## Quick Start

### 1. Reset Database with Seed Data

```bash
npx supabase db reset
```

This will create:
- 5 test user accounts
- 1 organization (Ruang Baca Dino 🦕)
- 3 events with participations
- 10 tasks in various states
- 6 skills with member assignments
- 4 event tags
- 3 resources

### 2. Start Dev Server

```bash
npm run dev
```

App runs at: **http://localhost:3000**

---

## 🔐 Test Accounts

All passwords: **`password123`**

| Email | Name | Role | Permissions |
|-------|------|------|-------------|
| `alice@test.com` | Alice Admin | Admin | All permissions |
| `bob@test.com` | Bob Coordinator | Coordinator | Can create/edit events & tasks |
| `charlie@test.com` | Charlie Volunteer | Member | Can view & create tasks |
| `diana@test.com` | Diana Designer | Member | Limited permissions |
| `eve@test.com` | Eve Newcomer | - | Not onboarded |

---

## 🦕 Organization Details

**Name**: Ruang Baca Dino  
**Slug**: `ruang-baca-dino`  
**Join Code**: `BERNAS-DINO01`  
**Avatar**: 🦕  

---

## 🚀 Quick Test Navigation

### Sign In
1. Go to: http://localhost:3000/auth/sign-in
2. **By default, password authentication is enabled** (for testing)
3. Enter email: `alice@test.com`
4. Enter password: `password123`
5. Click "Sign in"

**Toggle auth method**: Click "Use magic link instead" to switch to magic link auth (requires Mailpit)

### Main Test Event (5 tasks)
http://localhost:3000/ruang-baca-dino/events/e1111111-1111-1111-1111-111111111111

**Tasks in this event:**
- ✅ Prepare workshop materials (Bob, in_progress, 5 days)
- ✅ Send invitations (Charlie, done, **PAST DUE**)
- ⚪ Book venue (Unassigned, todo, 6 days)
- ✅ Design promotional posters (Diana, in_progress, 4 days)
- ⚪ Set up registration form (Unassigned, todo, 5 days)

---

## 🎯 Testing Scenarios

### A. Three View Modes

1. Navigate to event detail page
2. Scroll to **Tasks** section
3. Click view switcher buttons:
   - **List** - Cards with status badges
   - **Table** - Sortable columns (TanStack Table)
   - **Kanban** - Three columns by status

**Expected:**
- List view shows tasks as cards
- Table view allows sorting by title, status, deadline
- Kanban view groups: To Do (6), In Progress (3), Done (1)

---

### B. Smart Assignee Dropdown

**Test 1: Event Participants First**
1. Click "Add Task" on Event 1
2. Check assignee dropdown
3. **Expected**: Bob, Charlie, Diana shown first (they're participating)

**Test 2: Non-Participant Warning**
1. Go to Event 2: http://localhost:3000/ruang-baca-dino/events/e2222222-2222-2222-2222-222222222222
2. Create task and assign to Diana
3. **Expected**: Warning shown (Diana declined participation)

**Test 3: Search All Members**
1. In assignee dropdown, search for "charlie"
2. **Expected**: Shows all members in secondary section

---

### C. Skill Highlighting

**Test: Matching Skills**
1. Create task requiring: `public-speaking`, `event-planning`
2. Open assignee dropdown
3. **Expected**:
   - Bob highlighted (has both skills)
   - Charlie shows partial match (only event-planning)
   - Diana not highlighted (has neither)

**Member Skills:**
- Bob: event-planning, public-speaking, budgeting
- Charlie: event-planning, social-media
- Diana: graphic-design, photography, social-media

---

### D. Permission-Based UI

**Test as Admin (Alice)**
1. Login: `alice@test.com / password123`
2. Navigate to any event
3. **Expected**: See Add Task, Edit, Delete buttons

**Test as Coordinator (Bob)**
1. Logout and login: `bob@test.com / password123`
2. Navigate to any event
3. **Expected**: See Add Task, Edit (NO Delete button)

**Test as Member (Charlie)**
1. Logout and login: `charlie@test.com / password123`
2. Navigate to any event
3. **Expected**: See Add Task only (NO Edit or Delete)

---

### E. Task CRUD Operations

**Create Task**
1. Click "Add Task"
2. Fill in:
   - Title: "Test task"
   - Description: "Testing task creation"
   - Status: "To Do"
   - Deadline: Pick a date
   - Assignee: Select a member
   - Skills: Select 1-2 skills
3. Click "Create Task"
4. **Expected**: Toast success, task appears in all views

**Edit Task**
1. Find task in list
2. Click Edit button
3. Change status: "To Do" → "In Progress"
4. **Expected**: Task moves to In Progress column (Kanban view)

**Delete Task**
1. As Admin only
2. Click Delete on any task
3. Confirm deletion
4. **Expected**: Task removed from all views

---

### F. Task Distribution

**Current seed data:**

**Event 1 (Community Theater Workshop)** - 5 tasks  
**Event 2 (Cultural Festival Planning)** - 3 tasks  
**Event 3 (Art Exhibition Opening)** - 2 tasks  
**Standalone** - 1 task

**By Status:**
- To Do: 6 tasks (60%)
- In Progress: 3 tasks (30%)
- Done: 1 task (10%)

**By Assignment:**
- Assigned: 7 tasks
- Unassigned: 3 tasks

---

### G. Edge Cases

**Past Deadline**
- Task: "Send invitations" (Charlie, done, -2 days)
- **Expected**: Shows as overdue but marked done

**Unassigned Tasks**
- Task: "Book venue" (Unassigned, todo)
- Task: "Set up registration form" (Unassigned, todo)
- Task: "Review sponsorship proposals" (Unassigned, todo)
- **Expected**: Shows "Unassigned" in all views

**Standalone Task**
- Task: "Update organization website" (no event_id)
- **Expected**: Only visible in organization task list (not event detail)

---

## 🔧 Development Tools

### Supabase Studio
http://127.0.0.1:54323

Browse database tables, run queries, check RLS policies

### Mailpit (Local Email)
http://127.0.0.1:54324

View magic link emails if using email authentication

### Database Queries

```bash
# Check users
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT email, raw_user_meta_data->>'full_name' FROM auth.users"

# Check tasks
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT title, status FROM public.tasks ORDER BY created_at"

# Check participations
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT e.name, u.email, ep.status FROM public.event_participations ep JOIN public.events e ON ep.event_id = e.id JOIN public.org_members om ON ep.member_id = om.id JOIN auth.users u ON om.user_id = u.id"
```

---

## 🐛 Troubleshooting

### "Email sign-in failed" or "Sign-in failed. Check your email and password."
**Fixed!** Both issues have been resolved:

1. **Auth field mismatch**: Updated seed.sql to include all required Supabase auth.users fields (confirmation_token, recovery_token, email_change, etc. must be empty strings, not NULL)
2. **Password auth added**: The sign-in form now defaults to password authentication for local testing

**Solution**: Run `npx supabase db reset` to apply the updated seed data.

Toggle between password and magic link using the link at the bottom of the sign-in form.

### Can't see tasks
1. Make sure you're logged in as a user with permissions
2. Navigate to the correct event detail page
3. Check browser console for errors

### Stale data after changes
The event detail page uses `export const dynamic = 'force-dynamic'` and double-refresh pattern. If data doesn't update:
1. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. Check if server action completed successfully (check toast notification)

### Database reset needed
```bash
npx supabase db reset
```

This drops everything and re-seeds with fresh test data.

---

## 📊 Test Data Summary

### Events

| ID | Name | Tasks | Participants | Tags |
|----|------|-------|--------------|------|
| e1111111... | Community Theater Workshop | 5 | Bob (full), Charlie (partial), Diana (full) | WORKSHOP, COMMUNITY |
| e2222222... | Cultural Festival Planning | 3 | Bob (full), Diana (declined) | PLANNING, COMMUNITY |
| e3333333... | Art Exhibition Opening | 2 | Diana (full), Charlie (partial) | COMMUNITY, ARTS |

### Skills

- `event-planning` (Bob, Charlie)
- `public-speaking` (Bob)
- `graphic-design` (Diana)
- `budgeting` (Bob)
- `social-media` (Charlie, Diana)
- `photography` (Diana)

### Tags (with colors)

- WORKSHOP (#3b82f6)
- PLANNING (#22c55e)
- COMMUNITY (#f59e0b)
- ARTS (#a855f7)

---

## 📝 Known Issues / TODOs

### Skills Color UI (Low Priority)
- Database has `skills.color` column
- Currently not used in UI (only tags have colors)
- Future enhancement: Add color picker in skills management

**Location of TODO**: `supabase/seed.sql` line 270

---

## 🎉 Happy Testing!

For detailed implementation patterns and architecture decisions, see:
- [AGENTS.md](./AGENTS.md) - Project overview & tech stack
- [PATTERNS.md](./PATTERNS.md) - Code patterns & best practices
- [FEATURES.md](./FEATURES.md) - Feature specifications

**Main test URL:**
```
http://localhost:3000/ruang-baca-dino/events/e1111111-1111-1111-1111-111111111111
```

Login: `alice@test.com / password123`
