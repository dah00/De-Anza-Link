# DeAnza Link: Progress

Last updated: Saturday, Oct 17, 2026, 10:55am. Demo at 2:00pm.

`AGENTS.md` is the brief (scope, rules, design). This file is the current state of the build. Update it when you finish something.

## Architecture

```
Browser ──► proxy.ts ──► Next.js App Router (server components + server actions) ──► Supabase
            (session,                                                                (Postgres + RLS,
             redirects)                                                               Auth, Storage)
```

- **Next.js 16.4 (App Router, Turbopack)** for pages and backend. No separate API server. Reads happen in server components; writes go through server actions (`"use server"` files).
- **Supabase** for everything stored:
  - **Auth:** email and password, using cookie sessions via `@supabase/ssr`.
  - **Postgres:** tables `profiles`, `activities`, `participations`. Row-level security is on for all of them.
  - **Storage:** the `avatars` bucket, one folder per user id.
- **Route protection** lives in `proxy.ts` and `lib/supabase/proxy.ts`. On every request it refreshes the session, then:
  - signed out: redirect to `/login`
  - signed in but onboarding not finished: redirect to `/onboarding`
  - onboarded and visiting `/login`, `/signup`, or `/onboarding`: redirect to `/`

### Folder map

| Path                                       | What's there                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `app/(auth)/`                              | `/login`, `/signup`, and the `signUp`, `logIn`, `logOut` actions                                  |
| `app/onboarding/`                          | 3-step flow: interests, photo, then name, major, and bio                                          |
| `app/(tabs)/`                              | Everything with the bottom nav. `layout.tsx` adds the phone-width container and `BottomNav`       |
| `app/(tabs)/page.tsx`                      | Home                                                                                              |
| `app/(tabs)/activities/`                   | List and search (`page.tsx`), upcoming (`upcoming/`), detail (`[id]/`), create (`new/`)           |
| `app/(tabs)/account/`                      | View and edit profile, log out                                                                    |
| `components/`                              | Shared UI: `activity-card`, `avatar`, `avatar-stack`, `join-button`, `bottom-nav`, `ui/` (shadcn) |
| `lib/supabase/`                            | `server.ts` (server components and actions), `client.ts` (browser), `proxy.ts` (session refresh)  |
| `lib/activities.ts`                        | `Activity` type and queries (`getUpcomingActivities`, `getActivity`)                              |
| `lib/activity-actions.ts`                  | `joinActivity`, `leaveActivity`, `createActivity`, `deleteActivity`                               |
| `lib/interests.ts`, `lib/locations.ts`     | Fixed interest list (grouped) and campus spots                                                    |
| `lib/time.ts`                              | Campus time zone helpers ("Today", "Tomorrow", and form day and time to a real timestamp)         |
| `lib/maps.ts`                              | Google Maps and Apple Maps links                                                                  |
| `supabase/schema.sql`, `supabase/seed.sql` | Database schema and demo data. Both are safe to re-run                                            |

### Data model

- **`profiles`:** `id` (same as the auth user), `email`, `display_name`, `major`, `bio`, `photo_url`, `is_18_plus`, `interests text[]`, `onboarding_completed`. A trigger (`handle_new_user`) creates the row at sign-up.
- **`activities`:**
  - `title` (up to 80 characters), `description` (up to 500), `interest`, `starts_at`
  - `location`: a campus spot or an off-campus place name
  - `address`: off-campus only, otherwise null
  - `max_people` (2 to 20), `creator_id`
- **`participations`:** `(activity_id, user_id)` primary key and `joined_at`. A trigger (`check_activity_capacity`) locks the activity row and rejects a join if the activity is full or has already started.

## Key decisions and why

- **Supabase instead of our own auth and database.** It gives us login, a database, and file storage in one free service, with no backend to deploy. Row-level security means the safety rules ("only edit your own stuff") are enforced by the database, not just the UI.
- **Server actions instead of API routes.** There's less code and no fetch boilerplate, and types are shared between form and server. After a write, `refresh()` re-renders the page with fresh data.
- **Capacity is checked in the database, not in the app.** Two people tapping "I'm down" for the last spot at the same time can't both get in. The app turns the database errors (`activity_full`, `activity_started`) into friendly messages.
- **All times use the campus time zone (America/Los_Angeles).** "Today", "Happening today", and the create form's day and time all follow campus time, not the browser's or the server's. The conversion is hand-written in `lib/time.ts` and handles daylight saving.
- **Seed times are relative to when you run the seed.** Activities are "today at 2pm", "in 3 hours", and so on, so the demo never shows past events. The catch: **re-run `seed.sql` on demo morning.**
- **Off-campus places need a place name plus an address.** De Anza doesn't have everything (no pickleball court, for example). The form says "public place, no home addresses". Address suggestions go through `/api/address-suggest` (Photon house search, Nominatim if Photon fails) so the browser never calls those APIs directly. Type `22350 Homestead` → pick `22350 Homestead Road, Los Altos, CA 95014`. If both lookups fail, typed addresses still work. Every activity gets Google Maps and Apple Maps links; campus spots use De Anza's address.
- **Activities filter is chips plus a search bar.** Chips only show interests that have upcoming activities, so the row stays short. Search matches every word you type against title, interest, place, address, and description. If nothing matches, "Start one" opens the create form with the interest pre-filled.
- **Home is never empty.** It shows "Your upcoming" (first 4, then "View all" to `/activities/upcoming`), then "For you" (your interests, almost-full first, because "needs 1 more" is a strong nudge), then "Happening today" (other things today that aren't already in For you), then shortcuts to create an activity and to Resources.
- **Sample people use pravatar.cc photos.** The `Avatar` component falls back to initials if an image fails to load, so a bad network doesn't leave broken images.

## Conventions

- **Read `AGENTS.md` first.** It covers scope, the UI design rules, and the "explain every change" format.
- **Next.js 16 is different from older versions.** Check `node_modules/next/dist/docs/` before using an API you remember.
  - `cacheComponents` is on. Anything that reads cookies, `params`, or `searchParams` must be inside `<Suspense>`, and so must `usePathname()` on dynamic routes. `next build` fails loudly if you forget.
  - Route protection is in `proxy.ts`. This was called `middleware.ts` in older versions.
  - Page props use the global `PageProps<"/route">` type.
- **Supabase client:** use `@/lib/supabase/server` on the server and `@/lib/supabase/client` in the browser. Never use the service-role or secret key in the app.
- **Server actions** return `{ error: string }` for messages the user should see, and either redirect or call `refresh()` on success. Validate everything on the server, even if the form already checked it.
- **UI:**
  - Off-white background, green accent (the `primary` theme color), dark gray text. No gradients, glow, or emoji in headings.
  - Reuse `Button`, `Input`, `ActivityCard`, and `Avatar` instead of styling new ones.
  - Mobile first: everything sits in a `max-w-md` column.
  - Copy is short and casual ("I'm down", "Can't make it", "Who's going").
- **Fixed lists** (interests, campus spots) live in `lib/`. Validate with `isInterest` and `isCampusLocation` before saving.
- **Schema changes** go in `supabase/schema.sql` and must stay re-runnable (`if not exists`, `drop policy if exists`). Tell the team when you change it, since everyone has to re-run it.
- **Before pushing:** `npm run format && npm run lint && npm run build`.
- **Secrets** only go in `.env.local`. Add new variable names (no values) to `.env.example`.

## Setup (new machine or teammate)

1. `npm install`, then `cp .env.example .env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API).
2. In Supabase's SQL Editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. In Supabase, go to Authentication → Sign In / Providers → Email and turn off **Confirm email**. Otherwise sign-up waits for an email link.
4. `npm run dev`. Sample accounts: `maya.chen@example.com` (and the other seed emails), password `deanzalink-demo`.

## Done

These were all tested in the browser against the real Supabase project.

- [x] **Project setup:** 4-tab bottom nav, Supabase connected, schema, and seed data (8 students, 16 activities including one off-campus).
- [x] **Registration:** sign up with email, password, and 18+ checkbox (also enforced by the database); log in; log out; protected pages.
- [x] **Onboarding:** grouped interests with search, then photo upload to Supabase Storage, then name, major, and bio, with a progress bar. Users who didn't finish are sent back to it.
- [x] **Activities:**
  - list grouped by day, with interest chips and the search bar
  - dedicated "Your upcoming" page at `/activities/upcoming`, linked from the Activities header and Home's "View all"
  - detail page with who's going, the host label, and map links
  - "I'm down" and "Can't make it"
  - create, for campus or off-campus places; off-campus address suggestions via Photon; the host joins automatically
  - delete, for the host only
- [x] **Home:** Your upcoming (capped at 4), For you, Happening today, and the two shortcuts.
- [x] **Account (built by a teammate, not yet committed):** edit name, major, bio, and interests; log out.

## In progress / not started

- [ ] **Resources AI assistant (next up, priority 6 in `AGENTS.md`).** Not started. Plan:
  - `docs/resources.md` holds the resource data. Only verified De Anza info; this is the only source the assistant may use.
  - A server action or route calls the Claude API with that file in the prompt.
  - A simple chat UI at `app/(tabs)/resources/page.tsx`.
  - New env var `ANTHROPIC_API_KEY`, server only. Add the name to `.env.example`.
  - It must answer "Where can I get free food?" well for the demo.
- [ ] **Uncommitted work:** the Activities tab, Account tab, `lib/maps.ts`, and the schema, seed, and `AGENTS.md` changes are all still uncommitted on `main`. Commit them before anything else.
- [ ] **Hosting:** not decided. `AGENTS.md` still says "_fill in_". Vercel is the easy choice for Next.js.
- [ ] **Team ownership table** in `AGENTS.md` is still blank.

## Known bugs and rough edges

- **Resources is a 404.** The Resources tab and Home's "Ask about De Anza" shortcut link to `/resources`, which doesn't exist yet. This breaks the last step of the demo path until the assistant is built.
- **`npm run lint` fails** on the old mock pages from the merged branch, `app/home/page.tsx` and `app/profile/page.tsx`: there's an unescaped `'` in each. Those pages are also reachable at `/home` and `/profile`, duplicating Home and Account. Either delete them (ask the teammate first) or escape the two apostrophes.
- **Seed data goes stale.** Activity times are set when the seed runs, so "Today" activities drift into the past. Re-run `supabase/seed.sql` shortly before the demo. This also resets anyone's joins on seed activities.
- **Account can't change the photo.** The photo shows, but there's no re-upload yet. Onboarding is currently the only place to upload one.
- **Search ignores the selected chip.** Typing a search looks across all activities, even if an interest chip was selected. This is on purpose, but it could surprise someone.
- **Not tested live:** two people taking the last spot at the same moment. The database trigger should handle it, but we haven't reproduced it.
- **To check:** the Memorial Park address in the seed (21221 Stevens Creek Blvd). Confirm it before showing the map link.
- **Dev-only quirks, not real bugs:**
  - After editing `app/globals.css`, the dev server can serve stale CSS. Restart `npm run dev`.
  - Hydration warnings mentioning `data-cursor-ref` come from Cursor's built-in browser, not our code.

## Next steps (in order)

1. Commit the current work (Activities, Account, schema and seed changes) so teammates can pull it.
2. Build the Resources assistant. Write `docs/resources.md` first, since the answers can only be as good as that file.
3. Fix the lint errors or remove `app/home` and `app/profile` so `npm run build` and lint pass cleanly.
4. Decide on hosting and deploy early (Vercel plus the env vars), then run the full demo path on the deployed URL and on a phone.
5. Demo polish:
   - loading states (Suspense fallbacks exist but are plain)
   - empty states
   - phone-width check on every screen
6. Optional, only if 1–5 are done: photo re-upload on Account, then the activity group chat.
7. **Demo morning:** re-run `seed.sql`, sign up a fresh account, and walk the demo path: sign up, onboarding, Home, open an activity, tap "I'm down", see it in Your upcoming, ask Resources "Where can I get free food?".
