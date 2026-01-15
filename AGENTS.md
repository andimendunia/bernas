# AGENTS.md

## Project overview
- Bernas: SaaS for LSM/NGO event management and participation intent.
- Stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase.
- Primary color: `#df7f80`.

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

## UI conventions
- Use shadcn/ui components for UI.
- Use `sidebar-07` layout (`/dashboard`) as the app shell.
- Use `Tabs` component on onboarding (`/onboarding`) with custom active styles.
- Keep i18n ready (next-intl); currently English only.

## Navigation
- Dashboard routes are wrapped by `src/app/dashboard/layout.tsx`.
- Sidebar nav lives in `src/components/app-sidebar.tsx` and `src/components/nav-main.tsx`.
- Organization shortcut list uses `src/components/nav-projects.tsx`.

## Supabase schema + RLS
- Migration file: `supabase/migrations/0001_init.sql`
- Onboarding/org helpers: `supabase/migrations/0002_org_onboarding.sql`, `supabase/migrations/0003_fix_join_code.sql`, `supabase/migrations/0004_org_avatar.sql`
- Includes organizations, members, events, tasks, tags, participation, resources.
- RLS is member-based via `public.is_org_member`.

## Onboarding flow
- `/dashboard` requires `user_metadata.onboarded`.
- `/onboarding` sets `onboarded` and org intent in user metadata (placeholder).
- Next step: persist org creation/join in DB.

## Page titles
- Org-context pages use `Page - Panggung Minoritas`.
- Non-org pages use `Page - Bernas`.

## Files to know
- UI: `src/components/ui/*`, `src/components/app-sidebar.tsx`
- Pages: `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/onboarding/page.tsx`
- Supabase helpers: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
