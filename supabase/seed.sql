-- =============================================================================
-- BERNAS TEST DATA - QUICK START GUIDE
-- =============================================================================
-- After running: npx supabase db reset
--
-- TEST ACCOUNTS:
--   alice@test.com / password123  (Admin - all permissions)
--   bob@test.com / password123    (Coordinator - can create/edit)
--   charlie@test.com / password123 (Member - limited permissions)
--   diana@test.com / password123   (Member - for skill testing)
--   eve@test.com / password123     (Not onboarded)
--
-- TEST ORG:
--   Ruang Baca Dino 🦕 (ruang-baca-dino)
--   Join Code: BERNAS-DINO01
--
-- QUICK NAVIGATION:
--   http://localhost:3000/ruang-baca-dino/events/e1111111-1111-1111-1111-111111111111
--   (Community Theater Workshop - 5 tasks to test all features)
--
-- TASK DISTRIBUTION:
--   - To Do: 6 tasks
--   - In Progress: 3 tasks
--   - Done: 1 task
-- =============================================================================

-- =============================================================================
-- 1. TEST USERS (auth.users + auth.identities)
-- =============================================================================
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at
) values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alice@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"onboarded":true,"org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","active_org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","last_visited_org_slug":"ruang-baca-dino"}'::jsonb,
    '{"full_name":"Alice Admin"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'bob@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"onboarded":true,"org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","active_org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","last_visited_org_slug":"ruang-baca-dino"}'::jsonb,
    '{"full_name":"Bob Coordinator"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'charlie@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"onboarded":true,"org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","active_org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","last_visited_org_slug":"ruang-baca-dino"}'::jsonb,
    '{"full_name":"Charlie Volunteer"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'diana@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"onboarded":true,"org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","active_org_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","last_visited_org_slug":"ruang-baca-dino"}'::jsonb,
    '{"full_name":"Diana Designer"}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'eve@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Eve Newcomer"}'::jsonb,
    now(),
    now(),
    now()
  );

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"alice@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"bob@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"charlie@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '{"sub":"44444444-4444-4444-4444-444444444444","email":"diana@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    '{"sub":"55555555-5555-5555-5555-555555555555","email":"eve@test.com"}'::jsonb,
    'email',
    now(),
    now(),
    now()
  );

-- =============================================================================
-- 2. ORGANIZATION
-- =============================================================================
insert into public.organizations (
  id,
  name,
  slug,
  tier,
  created_by,
  join_code,
  avatar_emoji,
  avatar_color,
  created_at,
  updated_at
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Ruang Baca Dino',
  'ruang-baca-dino',
  'free',
  '11111111-1111-1111-1111-111111111111',
  'BERNAS-DINO01',
  '🦕',
  '#df7f80',
  now(),
  now()
);

-- =============================================================================
-- 3. ROLES & ROLE PERMISSIONS
-- =============================================================================
insert into public.roles (
  id,
  org_id,
  name,
  description,
  is_default,
  created_at,
  updated_at
) values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Coordinator',
    'Event and task coordination role',
    false,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Member',
    'Default role with basic view permissions',
    true,
    now(),
    now()
  );

insert into public.role_permissions (role_id, permission_id)
select
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  id
from public.permissions
where name in (
  'events.view',
  'events.create',
  'events.edit',
  'tasks.view',
  'tasks.create',
  'tasks.edit',
  'tasks.assign',
  'members.view',
  'resources.view',
  'resources.create'
);

insert into public.role_permissions (role_id, permission_id)
select
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  id
from public.permissions
where name like '%.view';

-- =============================================================================
-- 4. ORG MEMBERS
-- =============================================================================
insert into public.org_members (org_id, user_id, is_admin, role_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', true, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- =============================================================================
-- 5. SKILLS
-- =============================================================================
-- TODO: Skills color UI implementation
-- The color column exists in the database but is not currently used in the UI.
-- Tags use colors for visual categorization, but skills don't need colors yet.
-- Future enhancement: Add color picker in skills management UI.
-- =============================================================================
insert into public.skills (org_id, name, description, color)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'event-planning', null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'public-speaking', null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'graphic-design', null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'budgeting', null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'social-media', null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'photography', null, null);

-- =============================================================================
-- 6. MEMBER SKILLS
-- =============================================================================
insert into public.member_skills (org_id, member_id, skill_id)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '22222222-2222-2222-2222-222222222222' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'event-planning')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '33333333-3333-3333-3333-333333333333' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'event-planning')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '22222222-2222-2222-2222-222222222222' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'public-speaking')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'graphic-design')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '22222222-2222-2222-2222-222222222222' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'budgeting')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '33333333-3333-3333-3333-333333333333' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'social-media')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'social-media')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'photography')
  );

-- =============================================================================
-- 7. EVENT TAGS
-- =============================================================================
insert into public.event_tags (org_id, name, color)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'WORKSHOP', '#3b82f6'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PLANNING', '#22c55e'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'COMMUNITY', '#f59e0b'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ARTS', '#a855f7');

-- =============================================================================
-- 8. EVENTS
-- =============================================================================
insert into public.events (
  id,
  org_id,
  name,
  description,
  metadata,
  created_by,
  created_at,
  updated_at
) values
  (
    'e1111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Community Theater Workshop',
    'Interactive workshop on community theater techniques and storytelling',
    format(
      '{"start_date":"%s","end_date":"%s"}',
      to_char(now() + interval '7 days', 'YYYY-MM-DD'),
      to_char(now() + interval '7 days', 'YYYY-MM-DD')
    )::jsonb,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Cultural Festival Planning',
    'Planning session for the upcoming annual cultural festival',
    format(
      '{"start_date":"%s"}',
      to_char(now() + interval '14 days', 'YYYY-MM-DD')
    )::jsonb,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Art Exhibition Opening',
    'Opening night for local artists showcase',
    format(
      '{"start_date":"%s","end_date":"%s"}',
      to_char(now() + interval '21 days', 'YYYY-MM-DD'),
      to_char(now() + interval '21 days', 'YYYY-MM-DD')
    )::jsonb,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  );

-- =============================================================================
-- 9. EVENT TAG LINKS
-- =============================================================================
insert into public.event_tag_links (org_id, event_id, tag_id)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    (select id from public.event_tags where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'WORKSHOP')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    (select id from public.event_tags where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'COMMUNITY')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    (select id from public.event_tags where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'PLANNING')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    (select id from public.event_tags where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'COMMUNITY')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e3333333-3333-3333-3333-333333333333',
    (select id from public.event_tags where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'COMMUNITY')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e3333333-3333-3333-3333-333333333333',
    (select id from public.event_tags where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'ARTS')
  );

-- =============================================================================
-- 10. EVENT SKILL LINKS
-- =============================================================================
insert into public.event_skill_links (org_id, event_id, skill_id)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'public-speaking')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'event-planning')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'event-planning')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'budgeting')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e3333333-3333-3333-3333-333333333333',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'graphic-design')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e3333333-3333-3333-3333-333333333333',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'social-media')
  );

-- =============================================================================
-- 11. EVENT PARTICIPATIONS
-- =============================================================================
insert into public.event_participations (org_id, event_id, member_id, status, notes)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    (select id from public.org_members where user_id = '22222222-2222-2222-2222-222222222222' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'full',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    (select id from public.org_members where user_id = '33333333-3333-3333-3333-333333333333' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'partial',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'full',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    (select id from public.org_members where user_id = '22222222-2222-2222-2222-222222222222' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'full',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'declined',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e3333333-3333-3333-3333-333333333333',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'full',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e3333333-3333-3333-3333-333333333333',
    (select id from public.org_members where user_id = '33333333-3333-3333-3333-333333333333' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'partial',
    null
  );

-- =============================================================================
-- 12. TASKS
-- =============================================================================
insert into public.tasks (
  id,
  org_id,
  event_id,
  title,
  description,
  status,
  deadline,
  assignee_member_id,
  created_by,
  created_at,
  updated_at
) values
  (
    'a1111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    'Prepare workshop materials',
    'Create handouts and presentation slides',
    'in_progress',
    now() + interval '5 days',
    (select id from public.org_members where user_id = '22222222-2222-2222-2222-222222222222' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    'Send invitations',
    'Email invitations to potential participants',
    'done',
    now() - interval '2 days',
    (select id from public.org_members where user_id = '33333333-3333-3333-3333-333333333333' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    'Book venue',
    'Reserve community center for workshop date',
    'todo',
    now() + interval '6 days',
    null,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    'Design promotional posters',
    'Create eye-catching posters for social media',
    'in_progress',
    now() + interval '4 days',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e1111111-1111-1111-1111-111111111111',
    'Set up registration form',
    null,
    'todo',
    now() + interval '5 days',
    null,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a6666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    'Create budget spreadsheet',
    'Detailed budget breakdown for festival',
    'todo',
    now() + interval '10 days',
    (select id from public.org_members where user_id = '22222222-2222-2222-2222-222222222222' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a7777777-7777-7777-7777-777777777777',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    'Contact vendors',
    null,
    'todo',
    now() + interval '12 days',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a8888888-8888-8888-8888-888888888888',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e2222222-2222-2222-2222-222222222222',
    'Review sponsorship proposals',
    'Evaluate and respond to sponsor offers',
    'todo',
    now() + interval '9 days',
    null,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'a9999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    null,
    'Update organization website',
    'Refresh homepage with new events and photos',
    'todo',
    now() + interval '30 days',
    (select id from public.org_members where user_id = '33333333-3333-3333-3333-333333333333' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'e3333333-3333-3333-3333-333333333333',
    'Curate artist selections',
    'Review submissions and select featured artists',
    'in_progress',
    now() + interval '15 days',
    (select id from public.org_members where user_id = '44444444-4444-4444-4444-444444444444' and org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  );

-- =============================================================================
-- 13. TASK SKILL LINKS
-- =============================================================================
insert into public.task_skill_links (org_id, task_id, skill_id)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a1111111-1111-1111-1111-111111111111',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'public-speaking')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a1111111-1111-1111-1111-111111111111',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'event-planning')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a4444444-4444-4444-4444-444444444444',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'graphic-design')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a5555555-5555-5555-5555-555555555555',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'social-media')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a6666666-6666-6666-6666-666666666666',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'budgeting')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a6666666-6666-6666-6666-666666666666',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'event-planning')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a8888888-8888-8888-8888-888888888888',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'budgeting')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a9999999-9999-9999-9999-999999999999',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'social-media')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a9999999-9999-9999-9999-999999999999',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'graphic-design')
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    (select id from public.skills where org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and name = 'graphic-design')
  );

-- =============================================================================
-- 14. RESOURCES
-- =============================================================================
insert into public.resources (
  id,
  org_id,
  title,
  type,
  url,
  gdrive_id,
  created_by,
  created_at,
  updated_at
) values
  (
    'd1111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Event Planning Guide',
    'link',
    'https://example.com/planning-guide.pdf',
    null,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Budget Template',
    'link',
    'https://docs.google.com/spreadsheets/d/example',
    null,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  ),
  (
    'd3333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Organization Handbook',
    'link',
    'https://example.com/handbook.pdf',
    null,
    '11111111-1111-1111-1111-111111111111',
    now(),
    now()
  );

-- =============================================================================
-- 15. RESOURCE LINKS
-- =============================================================================
insert into public.resource_links (org_id, resource_id, linked_type, linked_id)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'd1111111-1111-1111-1111-111111111111',
    'event',
    'e1111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'd2222222-2222-2222-2222-222222222222',
    'event',
    'e2222222-2222-2222-2222-222222222222'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'd3333333-3333-3333-3333-333333333333',
    'org',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  );

-- =============================================================================
-- 16. JOIN REQUEST
-- =============================================================================
insert into public.join_requests (
  id,
  org_id,
  user_id,
  status,
  requested_at
) values (
  'f1111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '55555555-5555-5555-5555-555555555555',
  'pending',
  now()
);
