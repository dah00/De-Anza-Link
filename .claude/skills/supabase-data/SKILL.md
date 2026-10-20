---
name: supabase-data
description: Supabase schema, RLS, triggers, Storage, and seed rules for DeAnza Link. Use when changing supabase/schema.sql or seed.sql, writing queries, adding tables or policies, or handling profile photos.
---

# Supabase data layer

## Clients

- Server components and actions: `createClient()` from `@/lib/supabase/server`. Browser: `@/lib/supabase/client`.
- Only the anon/publishable key is used. **Never** put the service-role or secret key in the app. If something seems to need it, use a `security definer` SQL function instead (see `delete_own_account()`).

## Data model (`supabase/schema.sql`)

- **`profiles`:** `id` (= auth user id), `email`, `display_name`, `major`, `bio`, `photo_url`, `is_18_plus`, `interests text[]`, `onboarding_completed`. The `handle_new_user` trigger creates the row at sign-up from the auth metadata. A `check (is_18_plus)` constraint rejects anyone under 18.
- **`activities`:** `title` (≤80), `description` (≤500), `interest`, `starts_at`, `location` (campus spot or off-campus place name), `address` (off-campus only, else null), `max_people` (2–20), `creator_id`.
- **`participations`:** primary key `(activity_id, user_id)`, `joined_at`. The `check_activity_capacity` trigger locks the activity row and raises `activity_full` / `activity_started`. Actions map these to friendly messages.
- **`messages`** (planned, for chat): `id`, `activity_id`, `user_id`, `body`, `created_at`. Only participants may read or write.
- `delete_own_account()`: a signed-in user deletes themselves. It cascades to their profile, hosted activities, and joins. Avatar files are removed separately through the Storage API.

## Security

- RLS is on for every table. Ownership rules ("only edit your own profile and activities") are enforced by policies, not only by the UI.
- Only signed-in users can read profiles, activities, and messages.
- Capacity and other race-prone rules belong in the database (triggers/constraints), not in app code.

## Changing the schema

- Edit `supabase/schema.sql` and keep it re-runnable: `create ... if not exists`, `drop policy if exists` before `create policy`, `create or replace function`.
- Every new table gets RLS enabled plus explicit policies in the same change.
- Schema changes are shared. Call them out in your summary, because every teammate has to re-run the file. Moving to Supabase CLI migrations is on the roadmap (`docs/PROGRESS.md`).

## Storage

- `avatars` bucket, one folder per user: `<user id>/...`. Uploads happen right away from onboarding and Account. `profiles.photo_url` stores the photo's URL.

## Seed (`supabase/seed.sql`)

- **Dev and demo only. Never run it against production.** It creates sample users with a shared password (`deanzalink-demo`, e.g. `maya.chen@example.com`) and pravatar.cc photos.
- Activity times are relative to when it runs, so re-run it when "Today" items go stale. Re-running resets joins on seed activities.
