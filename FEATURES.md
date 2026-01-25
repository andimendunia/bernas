# FEATURES.md

## Overview

**Bernas** is a SaaS platform designed to solve event management and coordination challenges faced by LSMs (Lembaga Swadaya Masyarakat) and NGOs in Indonesia. While Bernas aims to serve many organizations, it is initially built to address the specific needs of **Panggung Minoritas**, a queer initiative based in Bandung, West Java.

## The Problem

LSMs like Panggung Minoritas face several coordination challenges:

1. **Event & Task Management**: Multiple concurrent events (grant proposals, merchandise sales, bi-monthly discussions, podcast production, zines) with unclear task ownership and deadlines
2. **Participation Tracking**: Need to know who can commit time to events (different from attendance tracking)
3. **Scattered Resources**: Documents (Google Docs, PDFs) and links spread across members' accounts with no centralized discovery
4. **Flexible Roles**: Organizational structure doesn't reflect practical reality - members wear multiple hats (e.g., Secretary who also handles merch and podcast editing)

## Core Concepts

### Events
Events are the heart of Bernas. Everything from "Submit Grant Proposal" to "Bi-monthly Discussion: Queer Identity" to "Sell Merch at Partner Event" is an event.

- Events have start/end dates
- Can be tagged (e.g., "Fundraising", "Bi-monthly Discussion", "Podcast")
- Contain tasks
- Can have resources attached
- Track member participation intent

### Tasks
Work items within events that can be assigned to specific members.

- Belong to an event
- Can be assigned to members
- Have due dates and status tracking
- Future: May suggest assignees based on member skills

### Tags
Categorization system for events and resources.

- **Format**: UPPERCASE, no spaces (e.g., "FUNDRAISING", "PODCAST", "BI-MONTHLY-DISCUSSION")
- Applied to events for categorization
- Applied to resources for organization
- Enables filtering and discovery across events and resources

### Skills
Capability tracking system for matching people to work.

- **Format**: lowercase, no spaces, can use hyphens (e.g., "audio-editing", "script-writing", "grant-writing")
- **Separate from tags**: Skills are NOT the same as tags
- Applied to members (who has this skill)
- Applied to events (this event needs these skills)
- Applied to tasks (this task needs these skills)
- Helps identify who can help with specific work

### Participation
Members declare their availability/intent to participate in events.

- **Not the same as attendance** - this is about commitment/availability
- Helps coordinators plan events knowing who's available
- Visible to organization members

---

## Implemented Features

### ✅ Organizations & Membership
- Multi-organization support (members can belong to multiple orgs)
- Organization profiles with custom avatars (emoji + color)
- Join codes for inviting new members
- Join request workflow (request → admin approval)
- Organization switcher for multi-org members

### ✅ Roles & Permissions System
- Custom roles per organization
- Granular permission system (e.g., `members.remove`, `events.create`, `org.edit_settings`)
- Admin role with automatic full permissions
- Default role assignment for new members
- Permission checks at UI and database (RLS) levels

**Key Permissions:**
- `org.edit_settings` - Edit organization details
- `members.change_role` - Assign/change member roles
- `members.remove` - Remove members from organization
- `roles.manage` - Create/edit/delete roles and permissions
- `join_requests.manage` - Approve/reject join requests
- (More permissions defined in migrations)

### ✅ Member Management
- View all organization members
- Change member roles (with permission)
- Remove members (with permission)
- Member profiles showing user info and assigned role

### ✅ Events & Tasks
- Event creation, editing, deletion with name, description, dates
- Tag assignment to events
- Task management within events
- Three view modes: List, Table (sortable), Kanban (drag columns)
- Task creation with assignee, deadline, status, skill requirements
- Task assignment with smart suggestions (participants first, skill matching)
- Task filtering and search
- Event participation tracking (interested, confirmed, declined)
- Event detail pages with tasks section
- Organization-wide tasks view (`/{org}/tasks`)
- Personal tasks view (`/{org}/tasks/mine`)

### ✅ Tags System
- UPPERCASE tag system for categorization
- Tag creation and management with color picker
- Applied to events and resources
- Filter events and resources by tags
- Tag badges with custom colors

### ✅ Resources Library
- Centralized resource repository
- Google Docs URLs, external links, file uploads
- Resource tagging for categorization
- Many-to-many event attachments
- Resource search and filtering
- Description and metadata tracking

### ✅ Skills System
- lowercase skills (separate from tags)
- Member skill assignments (self-service)
- Event skill requirements
- Task skill requirements
- Skill matching in assignee suggestions
- Skill highlighting in dropdowns
- Organization-wide skills management page

### ✅ Authentication & Onboarding
- Google OAuth (production) / Password + Magic link (local dev)
- Onboarding flow: Create organization OR Join existing
- App metadata auto-update via database triggers
- Organization slug-based routing
- Active organization switching

---

## Planned Features

### 📊 Dashboard & Analytics
- Upcoming events overview
- My assigned tasks summary
- Organization activity feed
- Event participation statistics
- Task completion metrics

### 🔔 Notifications
- Task assignment notifications
- Event reminders
- Join request notifications (for admins)
- Participation deadline reminders
- Task deadline alerts

### 📅 Calendar Integration
- Calendar view of all events
- Personal calendar with assigned tasks
- ICS export for external calendars
- Deadline visualization

### 🔍 Advanced Search & Filters 
  - Dedicated Skills page showing all skills with member avatars
  - Skills visible on member profiles
  - Skills shown in members table (badge list)
  - Event/task pages show required skills and who has them

**UI Location**: 
- Sidebar → Organization → Skills (new page)
- Member profiles (skills section)
- Organization → Info (members table with skills column)

**Skills Page UI**:
- Skill-centered view: Each row is a skill
- Avatar groups showing 3-5 members (click to see all)
- Click skill to see details, edit name (with permission)
- Filter/search skills
- Add new skills
- Manage your own skills

**User Stories:**
- As a member, I can tag myself with skills like "Podcast Editing", "Merch Design", "Grant Writing"
- As a coordinator, I can quickly see who has "Podcast" skills when planning a podcast event
- As a member, I can browse the Skills page to see who can help with what
- As an admin, I can assign skills to members who may not self-identify

### 🔍 Advanced Search & Filters
- Global search across events, resources, members, tasks
- Advanced filtering options
- Saved searches
- Search history

---

## Feature Relationships

```
Tags (UPPERCASE)
├── Applied to Events
└── Applied to Resources

Skills (lowercase)
├── Applied to Members (who has this skill)
├── Applied to Events (event needs these skills)
└── Applied to Tasks (task needs these skills)

Events
├── Contains Tasks
├── Has Resources attached (many-to-many)
├── Has Skills required (many-to-many)
├── Tracks Participation
└── Tagged with Tags

Tasks
├── Belongs to Event
├── Has Skills required (many-to-many)
├── Assigned to Members
└── Has status and deadline

Members
├── Have Roles → Have Permissions
├── Have Skills (many-to-many)
├── Participate in Events
├── Assigned to Tasks
└── Create Resources

Resources
├── Attached to Events (many-to-many)
├── Tagged with Tags
└── Created by Members
```

---

## Technical Implementation

See [AGENTS.md](./AGENTS.md) for technical stack, patterns, and development guidelines.
See [PATTERNS.md](./PATTERNS.md) for detailed code patterns and examples.

---

## Roadmap Priority

### Phase 1 (✅ Complete)
- ✅ Organization & member management
- ✅ Roles & permissions system
- ✅ Resources module
- ✅ Skills system
- ✅ Events & tasks full implementation
- ✅ Event-resource attachment
- ✅ Participation tracking

### Phase 2 (Current)
- Dashboard & analytics
- Calendar integration
- Notifications system
- Advanced search & filters

### Phase 3 (Future)
- Mobile app
- Integrations (Google Calendar, Slack, etc.)
- Advanced reporting
- Bulk operations
- Export/import functionality

---

## Design Principles

1. **Flexible Over Rigid**: Support how organizations actually work, not how org charts say they work
2. **Transparency**: Everyone sees what's happening (unless permissions explicitly restrict)
3. **Low Barrier**: Easy to add information (resources, skills, events) without formal processes
4. **Clear Naming Conventions**: 
   - Tags: UPPERCASE (for categorization)
   - Skills: lowercase (for capabilities)
   - Reduces confusion and improves scanability
5. **Permission-Aware**: Features adapt based on what users can do, but remain discoverable

---

*Last updated: January 2026*
