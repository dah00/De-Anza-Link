-- Demo data. Run after schema.sql: SQL Editor → New query → paste → Run.
-- Times are relative to when you run it, so re-run it the morning of the demo
-- to make sure "Happening today" has things in it. Safe to re-run.
-- Sample students can log in with their email and the password: deanzalink-demo

create or replace function pg_temp.day_at(days int, t time)
returns timestamptz
language sql
as $$
  select (((now() at time zone 'America/Los_Angeles')::date + days) + t)
    at time zone 'America/Los_Angeles'
$$;

create or replace function pg_temp.hours_from_now(h int)
returns timestamptz
language sql
as $$
  select date_trunc('hour', now()) + make_interval(hours => h)
$$;

-- Sample students
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', s.id::uuid, 'authenticated', 'authenticated', s.email,
  extensions.crypt('deanzalink-demo', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"is_18_plus":true}', now(), now(),
  '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001', 'maya.chen@example.com'),
  ('a0000000-0000-4000-8000-000000000002', 'diego.ramirez@example.com'),
  ('a0000000-0000-4000-8000-000000000003', 'priya.patel@example.com'),
  ('a0000000-0000-4000-8000-000000000004', 'jordan.lee@example.com'),
  ('a0000000-0000-4000-8000-000000000005', 'aisha.khan@example.com'),
  ('a0000000-0000-4000-8000-000000000006', 'kenji.tanaka@example.com'),
  ('a0000000-0000-4000-8000-000000000007', 'sofia.nguyen@example.com'),
  ('a0000000-0000-4000-8000-000000000008', 'marcus.johnson@example.com')
) as s(id, email)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.id::text like 'a0000000-0000-4000-8000-%'
on conflict (provider_id, provider) do nothing;

update public.profiles p
set display_name = s.display_name,
    major = s.major,
    bio = s.bio,
    photo_url = s.photo_url,
    interests = s.interests,
    onboarding_completed = true
from (values
  ('a0000000-0000-4000-8000-000000000001', 'Maya Chen', 'Psychology',
    'Psych major, always looking for a boba buddy.', 'https://i.pravatar.cc/200?img=47',
    array['Psychology', 'Coffee & Boba', 'Reading', 'Mental Health']),
  ('a0000000-0000-4000-8000-000000000002', 'Diego Ramirez', 'Computer Science',
    'Transferring to SJSU next fall. Will play any Smash character.', 'https://i.pravatar.cc/200?img=12',
    array['Computer Science', 'AI & Tech', 'Gaming', 'Soccer', 'Startups']),
  ('a0000000-0000-4000-8000-000000000003', 'Priya Patel', 'Biology',
    'Pre-med, part-time hiker, full-time coffee drinker.', 'https://i.pravatar.cc/200?img=45',
    array['Biology', 'Hiking', 'Photography', 'Study Groups']),
  ('a0000000-0000-4000-8000-000000000004', 'Jordan Lee', 'Business',
    'Hoops most days after 4.', 'https://i.pravatar.cc/200?img=33',
    array['Basketball', 'Fitness', 'Startups', 'Business']),
  ('a0000000-0000-4000-8000-000000000005', 'Aisha Khan', 'Nursing',
    'Nursing prereqs and a lot of yoga.', 'https://i.pravatar.cc/200?img=44',
    array['Nursing', 'Yoga', 'Cooking', 'Volunteering', 'Hiking']),
  ('a0000000-0000-4000-8000-000000000006', 'Kenji Tanaka', 'Engineering',
    'Will teach you chess if you teach me calc.', 'https://i.pravatar.cc/200?img=59',
    array['Engineering', 'Chess', 'Board Games', 'Anime', 'Gaming']),
  ('a0000000-0000-4000-8000-000000000007', 'Sofia Nguyen', 'Graphic Design',
    'Sketchbook always in my bag.', 'https://i.pravatar.cc/200?img=49',
    array['Art', 'Graphic Design', 'Thrifting', 'Music', 'Photography']),
  ('a0000000-0000-4000-8000-000000000008', 'Marcus Johnson', 'Undeclared',
    'Soccer, music, and trying every food spot on Stevens Creek.', 'https://i.pravatar.cc/200?img=68',
    array['Soccer', 'Running', 'Music', 'Gaming', 'Food Spots'])
) as s(id, display_name, major, bio, photo_url, interests)
where p.id = s.id::uuid;

-- Activities (deleting first also clears their participations)
delete from public.activities where id::text like 'b0000000-0000-4000-8000-%';

insert into public.activities (id, title, description, interest, starts_at, location, max_people, creator_id)
values
  ('b0000000-0000-4000-8000-000000000001', 'Psych 1 study group before the quiz',
    'Going over chapters 4 and 5. Bring your notes.', 'Psychology',
    pg_temp.hours_from_now(2), 'Library', 5, 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'Pickup soccer',
    'Casual 4v4, all levels. Wear something green or white.', 'Soccer',
    pg_temp.hours_from_now(3), 'Track & Field', 8, 'a0000000-0000-4000-8000-000000000008'),
  ('b0000000-0000-4000-8000-000000000003', 'Boba run after class',
    'Meeting in front of the Campus Center, then walking over.', 'Coffee & Boba',
    pg_temp.hours_from_now(4), 'Campus Center', 4, 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000004', 'Chess in the Sunken Garden',
    'I have two boards. Beginners welcome.', 'Chess',
    pg_temp.hours_from_now(5), 'Sunken Garden', 4, 'a0000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000005', 'Python homework help',
    'CIS 22A people, let''s get through the loops assignment together.', 'Computer Science',
    pg_temp.day_at(1, '11:00'), 'Library', 6, 'a0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000006', 'Plan a weekend hike',
    'Picking a trail and sorting out carpools.', 'Hiking',
    pg_temp.day_at(1, '13:00'), 'Kirsch Center', 6, 'a0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000007', 'Pickup basketball',
    'Running 3s. Show up and we''ll make teams.', 'Basketball',
    pg_temp.day_at(1, '16:00'), 'Fitness Center', 10, 'a0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000008', 'Bio lab report work session',
    'Quiet-ish. Working on the enzyme lab write-up.', 'Biology',
    pg_temp.day_at(2, '10:00'), 'Science Center', 4, 'a0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000009', 'Sketching on the quad',
    'Bring whatever you draw with. No skill needed.', 'Art',
    pg_temp.day_at(2, '12:30'), 'Main Quad', 6, 'a0000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000010', 'Smash Bros. after class',
    'I''ll bring a Switch and two extra controllers.', 'Gaming',
    pg_temp.day_at(2, '15:00'), 'Campus Center', 6, 'a0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000011', 'Campus photo walk',
    'Golden hour loop around campus. Phone cameras are fine.', 'Photography',
    pg_temp.day_at(3, '17:30'), 'Main Quad', 5, 'a0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000012', 'Morning yoga',
    'Easy 30 minute flow. Bring a mat or a towel.', 'Yoga',
    pg_temp.day_at(3, '09:00'), 'Fitness Center', 8, 'a0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000013', 'Board game hour',
    'Codenames and Catan. Drop in whenever.', 'Board Games',
    pg_temp.day_at(4, '14:00'), 'Campus Center', 6, 'a0000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000014', 'Open mic practice',
    'Trying out songs before the real open mic. Come listen or play.', 'Music',
    pg_temp.day_at(4, '18:00'), 'VPAC', 8, 'a0000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000015', 'Startup idea swap',
    'Bring one idea, leave with feedback.', 'Startups',
    pg_temp.day_at(5, '15:00'), 'Campus Center', 5, 'a0000000-0000-4000-8000-000000000004');

insert into public.activities (id, title, description, interest, starts_at, location, address, max_people, creator_id)
values
  ('b0000000-0000-4000-8000-000000000016', 'Pickleball at Memorial Park',
    'I''ll bring paddles and balls. Never played? Perfect.', 'Pickleball',
    pg_temp.day_at(2, '17:00'), 'Cupertino Memorial Park',
    '21221 Stevens Creek Blvd, Cupertino, CA 95014', 4, 'a0000000-0000-4000-8000-000000000004');

insert into public.participations (activity_id, user_id)
select ('b0000000-0000-4000-8000-0000000000' || a)::uuid, ('a0000000-0000-4000-8000-00000000000' || u)::uuid
from (values
  ('01', 1), ('01', 3), ('01', 5),
  ('02', 8), ('02', 2), ('02', 4), ('02', 6), ('02', 7), ('02', 3), ('02', 5),
  ('03', 1), ('03', 7),
  ('04', 6), ('04', 2), ('04', 8),
  ('05', 2), ('05', 6),
  ('06', 3), ('06', 5), ('06', 8), ('06', 4), ('06', 1),
  ('07', 4), ('07', 8), ('07', 2),
  ('08', 3), ('08', 5), ('08', 1),
  ('09', 7),
  ('10', 2), ('10', 8), ('10', 6),
  ('11', 3), ('11', 7),
  ('12', 5), ('12', 1),
  ('13', 6), ('13', 1), ('13', 2), ('13', 7), ('13', 8),
  ('14', 7), ('14', 8),
  ('15', 4), ('15', 2),
  ('16', 4), ('16', 8)
) as p(a, u);
