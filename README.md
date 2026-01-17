# 🌾 Bernas

**Event Management & Participation Platform for Indonesian LSMs (NGOs)**

Bernas is a modern SaaS platform designed to help Lembaga Swadaya Masyarakat (LSMs/NGOs) in Indonesia manage events, track participation intent, organize resources, and match skills with opportunities.

## ✨ Features

- **📅 Event Management** - Create, organize, and manage events with tags and participation tracking
- **✅ Task Management** - Break down events into actionable tasks with skill requirements
- **👥 Participation Intent** - Track who's interested, confirmed, or unavailable for events
- **📚 Resource Library** - Centralized storage for documents, links, and shared resources with tagging
- **🎯 Skills System** - Match member skills with event and task requirements
- **🏷️ Tagging System** - Categorize events and resources with customizable color-coded tags
- **👤 Member Management** - Role-based access control with granular permissions
- **🔐 Organization Onboarding** - Streamlined join workflows with admin approval
- **🌐 Multi-Organization Support** - Switch between organizations seamlessly

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (OAuth + Magic Links)
- **Storage**: Supabase Storage
- **RLS**: Row Level Security for data protection

### Key Libraries
- `@tanstack/react-table` - Advanced data tables with sorting/filtering
- `sonner` - Toast notifications
- `next-intl` - Internationalization (i18n ready)
- `lucide-react` - Icon library
- `next-themes` - Theme management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase CLI (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bernas.git
   cd bernas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Supabase locally** (optional)
   ```bash
   npx supabase@latest start
   ```
   
   Access Supabase Studio at http://127.0.0.1:54323

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000 to see the app

## 📁 Project Structure

```
bernas/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main application routes
│   │   ├── auth/               # Authentication flows
│   │   └── onboarding/         # Organization onboarding
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── administration/     # Admin panel components
│   │   ├── members/            # Member management
│   │   ├── organization/       # Organization components
│   │   ├── resources/          # Resource library
│   │   ├── skills/             # Skills management
│   │   └── tags/               # Tag management
│   └── lib/                    # Utilities and helpers
│       ├── supabase/           # Supabase clients
│       └── permissions.ts      # Permission helpers
├── supabase/
│   └── migrations/             # Database migrations
├── AGENTS.md                   # Technical documentation
├── FEATURES.md                 # Product specifications
└── PATTERNS.md                 # Code patterns & best practices
```

## 🗄️ Database Schema

### Core Tables
- `organizations` - Organization data with join codes and avatars
- `org_members` - Membership records with role assignments
- `roles` - Custom roles per organization
- `permissions` - System-wide permissions (predefined)
- `role_permissions` - Role-permission mappings
- `join_requests` - Organization join request workflow

### Event Management
- `events` - Event data
- `tasks` - Tasks linked to events
- `participation` - Member participation intent
- `event_tags` - UPPERCASE tags for categorization
- `event_tag_links` - Event-tag relationships
- `event_skill_links` - Skills required for events

### Resources & Skills
- `resources` - Resource library with URLs/files
- `resource_tag_links` - Resource-tag relationships
- `skills` - lowercase skills (separate from tags)
- `member_skills` - Member skill assignments
- `task_skill_links` - Skills required for tasks

## 🔐 Authentication & Permissions

### Authentication Flow
- **Sign-in**: `/auth/sign-in` (Google OAuth in production, magic link in local)
- **Callback**: `/auth/callback`
- **Sign-out**: `/auth/sign-out`

### Permission System
- Role-based access control (RBAC)
- Granular permissions (e.g., `members.remove`, `events.create`)
- Admin bypass (admins have all permissions)
- RLS policies enforce permissions at database level

## 🌱 Local Development

### Supabase Local Commands
```bash
# Start local Supabase
npx supabase@latest start

# Stop local Supabase
npx supabase@latest stop

# Reset database (apply migrations)
npx supabase@latest db reset
```

### Local Services
- **App**: http://localhost:3000
- **Supabase Studio**: http://127.0.0.1:54323
- **Mailpit** (local email): http://127.0.0.1:54324

## 📚 Documentation

- **[AGENTS.md](./AGENTS.md)** - Technical stack, architecture, and development patterns
- **[FEATURES.md](./FEATURES.md)** - Feature specifications and product roadmap
- **[PATTERNS.md](./PATTERNS.md)** - Code patterns, best practices, and conventions

## 🎨 Design Philosophy

- **Open Design** - Minimal borders, spacious layouts
- **Mobile-First** - Responsive design with Tailwind breakpoints
- **Accessible** - Built on Radix UI primitives
- **Consistent** - Design system based on shadcn/ui

## 🤝 Contributing

Contributions are welcome! Please read the documentation files for code patterns and conventions before submitting PRs.

## 📄 License

[MIT License](LICENSE)

## 🙏 Acknowledgments

Built with ❤️ for Indonesian LSMs, with primary user testing from **Panggung Minoritas** - a queer initiative in Bandung, Indonesia.

---

**Made with Next.js, Supabase, and Tailwind CSS**
