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

### ✅ Events (Planned - Schema Ready)
- Event creation with name, description, dates
- Tag assignment
- Task management within events
- (UI implementation pending)

### ✅ Tags (Schema Ready)
- Organizational tag system
- Used for events, resources, and skills
- (Full CRUD UI pending)

### ✅ Authentication & Onboarding
- Google OAuth (production) / Magic link (local dev)
- Onboarding flow: Create organization OR Join existing
- User metadata tracking (onboarded status, active organization)

---

## In Development Features

### 🚧 Resources Module
**Problem Solved**: Documents and links scattered across members' Google accounts, shared via group chat, difficult to discover.

**Solution**: Centralized resource library with event attachments.

**Specifications:**
- **Resource Types**: Google Docs URLs, external links, uploaded files (later)
- **Organization-wide Library**: All resources visible in one place
- **Event Attachments**: Many-to-many relationship (one resource can be attached to multiple events)
- **Tagging**: Uses same tag system as events (e.g., "Fundraising", "Podcast")
- **Metadata**: Title, URL, description, tags, created_by, created_at
- **Discovery**: List view with filters (by tag, by event, by search)
- **Permissions**: 
  - `resources.create` - Create resources
  - `resources.edit` - Edit any resource
  - `resources.delete` - Delete any resource
  - (Default role can create their own, view all)

**UI Location**: Sidebar → Resources (replaces "Repository")

**User Stories:**
- As a member, I can add a Google Doc link as a resource with tags
- As a member, I can attach an existing resource to multiple events
- As a member, I can filter resources by tag or event to find what I need
- As an event coordinator, I can see all resources attached to my event

---

### 🚧 Skills System
**Problem Solved**: Organizational roles don't reflect practical reality. Members have multiple competencies (e.g., Secretary + Merch + Podcast editing) but no way to document or discover "who can do what."

**Solution**: Skill system that documents member competencies and matches people to work.

**Specifications:**
- **Separate from Tags**: Skills are independent entities (NOT the same as event/resource tags)
- **Naming Convention**: lowercase, no spaces, can use hyphens (e.g., "audio-editing", "grant-writing")
- **Self-Service Creation**: Anyone can create new skills organization-wide
- **Self-Assignment**: Members can assign/remove skills for themselves
- **Skill Attachments**:
  - **Members**: Who has this skill
  - **Events**: This event needs these skills (helps find who can help)
  - **Tasks**: This task needs these skills (suggests assignees)
- **Permissions (Default Role)**:
  - Create skills: ✅ (everyone)
  - Assign skills to self: ✅
  - Remove skills from self: ✅
  - Edit/delete skills: ❌ (requires permission)
  - Assign/remove skills for others: ❌ (requires permission)
- **Discovery**: 
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

---

## Planned Features

### 📋 Events & Tasks (Full Implementation)
- Event creation UI with form
- Event detail pages
- Task creation and assignment within events
- Task status tracking
- Calendar view of events
- Event-resource attachment UI
- Participation intent tracking UI

### 📊 Dashboard & Analytics
- Upcoming events overview
- My assigned tasks
- Organization activity feed
- Event participation statistics

### 🔔 Notifications
- Task assignments
- Event reminders
- Join request notifications (for admins)
- Participation reminders

### 🔍 Advanced Search
- Cross-feature search (events, resources, members, tasks)
- Advanced filters
- Saved searches

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

### Phase 1 (Current)
- ✅ Organization & member management
- ✅ Roles & permissions system
- 🚧 Resources module
- 🚧 Skills system

### Phase 2
- Events UI (create, view, edit)
- Tasks UI (create, assign, track)
- Event-resource attachment
- Participation tracking

### Phase 3
- Dashboard & analytics
- Notifications
- Advanced search
- Mobile optimization

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
