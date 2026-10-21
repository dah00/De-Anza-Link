-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- Profiles: one row per user, created automatically on sign-up.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text,
  major text,
  bio text,
  photo_url text,
  is_18_plus boolean not null check (is_18_plus),
  interests text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Signed-in users can view profiles" on public.profiles;
create policy "Signed-in users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, is_18_plus)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data ->> 'is_18_plus')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profile photos: public bucket, each user can only write inside their own folder ("<user id>/...").
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can replace their own avatar" on storage.objects;
create policy "Users can replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Activities: small meetups anyone signed in can create and join.
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 500),
  interest text not null,
  starts_at timestamptz not null,
  location text not null,
  max_people int not null check (max_people between 2 and 20),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists activities_starts_at_idx on public.activities (starts_at);

-- Off-campus activities have a street address; campus spots leave it empty.
alter table public.activities
  add column if not exists address text check (char_length(address) <= 200);

-- The low end of the "how many people" range. The group chat opens once this many are going.
alter table public.activities
  add column if not exists min_people int not null default 2;

alter table public.activities
  drop constraint if exists activities_min_people_check;
alter table public.activities
  add constraint activities_min_people_check check (min_people between 2 and max_people);

alter table public.activities enable row level security;

drop policy if exists "Signed-in users can view activities" on public.activities;
create policy "Signed-in users can view activities"
  on public.activities for select
  to authenticated
  using (true);

drop policy if exists "Users can create activities as themselves" on public.activities;
create policy "Users can create activities as themselves"
  on public.activities for insert
  to authenticated
  with check ((select auth.uid()) = creator_id);

drop policy if exists "Users can edit their own activities" on public.activities;
create policy "Users can edit their own activities"
  on public.activities for update
  to authenticated
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

drop policy if exists "Users can delete their own activities" on public.activities;
create policy "Users can delete their own activities"
  on public.activities for delete
  to authenticated
  using ((select auth.uid()) = creator_id);

-- Participations: who is going to what.
create table if not exists public.participations (
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create index if not exists participations_user_id_idx on public.participations (user_id);

alter table public.participations enable row level security;

drop policy if exists "Signed-in users can see who is going" on public.participations;
create policy "Signed-in users can see who is going"
  on public.participations for select
  to authenticated
  using (true);

drop policy if exists "Users can join as themselves" on public.participations;
create policy "Users can join as themselves"
  on public.participations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can leave as themselves" on public.participations;
create policy "Users can leave as themselves"
  on public.participations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Blocks joining once an activity is full or has started. Locks the activity row so two
-- people tapping "I'm down" on the last spot can't both get in.
create or replace function public.check_activity_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  capacity int;
  starts timestamptz;
  taken int;
begin
  select max_people, starts_at into capacity, starts
  from public.activities
  where id = new.activity_id
  for update;

  if starts < now() then
    raise exception 'activity_started';
  end if;

  select count(*) into taken
  from public.participations
  where activity_id = new.activity_id;

  if taken >= capacity then
    raise exception 'activity_full';
  end if;

  return new;
end;
$$;

drop trigger if exists check_activity_capacity on public.participations;
create trigger check_activity_capacity
  before insert on public.participations
  for each row execute function public.check_activity_capacity();

-- Group chats: one per activity, opened by the trigger below once min_people are going.
-- No insert/update/delete policies, so only the trigger can open a chat. Once open it
-- stays open, even if people leave.
create table if not exists public.activity_chats (
  activity_id uuid primary key references public.activities (id) on delete cascade,
  opened_at timestamptz not null default now()
);

alter table public.activity_chats enable row level security;

drop policy if exists "Signed-in users can see which chats are open" on public.activity_chats;
create policy "Signed-in users can see which chats are open"
  on public.activity_chats for select
  to authenticated
  using (true);

-- Runs after check_activity_capacity, which already locked the activity row, so the
-- count here can't race with another join.
create or replace function public.open_activity_chat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  needed int;
  going int;
begin
  select min_people into needed
  from public.activities
  where id = new.activity_id;

  select count(*) into going
  from public.participations
  where activity_id = new.activity_id;

  if going >= needed then
    insert into public.activity_chats (activity_id)
    values (new.activity_id)
    on conflict do nothing;
  end if;

  return null;
end;
$$;

drop trigger if exists open_activity_chat on public.participations;
create trigger open_activity_chat
  after insert on public.participations
  for each row execute function public.open_activity_chat();

-- Open chats for activities that already had enough people before this trigger existed.
insert into public.activity_chats (activity_id)
select a.id
from public.activities a
where (select count(*) from public.participations p where p.activity_id = a.id) >= a.min_people
on conflict do nothing;

-- Chat messages. The foreign key to activity_chats means you can't post before the chat
-- opens. Only people currently going can read or post.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity_chats (activity_id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists messages_activity_id_created_at_idx
  on public.messages (activity_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "People going can read the chat" on public.messages;
create policy "People going can read the chat"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.participations p
      where p.activity_id = messages.activity_id
        and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "People going can post as themselves" on public.messages;
create policy "People going can post as themselves"
  on public.messages for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.participations p
      where p.activity_id = messages.activity_id
        and p.user_id = (select auth.uid())
    )
  );

-- When each person last read each chat, for unread dots.
create table if not exists public.chat_reads (
  activity_id uuid not null references public.activity_chats (activity_id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

alter table public.chat_reads enable row level security;

drop policy if exists "Users can see their own reads" on public.chat_reads;
create policy "Users can see their own reads"
  on public.chat_reads for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own reads" on public.chat_reads;
create policy "Users can add their own reads"
  on public.chat_reads for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own reads" on public.chat_reads;
create policy "Users can update their own reads"
  on public.chat_reads for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Marks a chat read using the database clock, so it lines up with messages.created_at.
create or replace function public.mark_chat_read(chat_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.chat_reads (activity_id, user_id, last_read_at)
  values (chat_id, auth.uid(), now())
  on conflict (activity_id, user_id) do update set last_read_at = excluded.last_read_at;
$$;

-- The signed-in user's open chats, latest activity first, with the last message and an
-- unread flag. Runs as the caller, so RLS on every table still applies.
drop function if exists public.my_chats();
create function public.my_chats()
returns table (
  activity_id uuid,
  title text,
  starts_at timestamptz,
  last_body text,
  last_at timestamptz,
  last_user_id uuid,
  last_name text,
  unread boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.activity_id,
    a.title,
    a.starts_at,
    m.body,
    coalesce(m.created_at, c.opened_at),
    m.user_id,
    pr.display_name,
    exists (
      select 1 from public.messages u
      where u.activity_id = c.activity_id
        and u.user_id <> (select auth.uid())
        and u.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
    )
  from public.activity_chats c
  join public.activities a on a.id = c.activity_id
  join public.participations p
    on p.activity_id = c.activity_id and p.user_id = (select auth.uid())
  left join public.chat_reads r
    on r.activity_id = c.activity_id and r.user_id = (select auth.uid())
  left join lateral (
    select body, created_at, user_id from public.messages
    where messages.activity_id = c.activity_id
    order by created_at desc
    limit 1
  ) m on true
  left join public.profiles pr on pr.id = m.user_id
  order by coalesce(m.created_at, c.opened_at) desc;
$$;

revoke all on function public.mark_chat_read(uuid) from public, anon;
grant execute on function public.mark_chat_read(uuid) to authenticated;
revoke all on function public.my_chats() from public, anon;
grant execute on function public.my_chats() to authenticated;

-- Live updates in the chat screen. Realtime still applies the select policy above.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- Lets a signed-in user delete their own auth user. Profile, hosted activities,
-- and joins cascade from that. Avatar files are removed through the Storage API
-- in the app — direct deletes on storage.objects are blocked by Supabase.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
