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
