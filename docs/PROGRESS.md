# DeAnza Link: Progress

Last updated: Tuesday, Oct 20, 2026. **Phase: post-hackathon hardening for real students.**

`AGENTS.md` is the brief. Detailed rules are in `.claude/skills/`. This file holds status only. Update it in the same change when you finish something, find an issue, or make a decision.

## Architecture

```
Browser ──► proxy.ts ──► Next.js App Router (server components + server actions) ──► Supabase
            (session,                                                                (Postgres + RLS,
             redirects)                                                               Auth, Storage)
                         app/api/navigator ──► Claude API (+ deanza.edu web search)
```

- One Next.js 16 app, no separate backend. Reads happen in server components; writes go through server actions.
- Supabase handles auth (cookie sessions via `@supabase/ssr`), Postgres (`profiles`, `activities`, `participations`, `activity_chats`, `messages`, `chat_reads`, all with RLS), Realtime (live chat), and Storage (`avatars`).
- `proxy.ts` gates every page (login → onboarding → app). It does **not** cover `/api/*`.

## Key decisions

- **Supabase** for auth, DB, and storage: no backend to run, and RLS enforces "own data only" in the database.
- **Server actions over API routes:** less code, shared types, `refresh()` after writes.
- **Capacity is enforced by a DB trigger**, so two people can't take the last spot.
- **Group chat opens automatically** once `min_people` are going (the low end of the host's min–max range). A DB trigger creates the `activity_chats` row; no one can open it by hand. Once open it stays open, even if people leave. Only people currently going can read or post.
- **Chats is a 5th tab** (Home · Activities · Chats · Resources · Account), decided Oct 20. Resources' icon changed to a compass so it doesn't look like a second chat tab.
- **Campus time zone everywhere** (America/Los_Angeles, hand-written DST-safe helpers in `lib/time.ts`).
- **Off-campus = public place name + address.** Geocoding goes through our `/api/address-suggest` (Photon → Nominatim).
- **Home is never empty:** Your upcoming → For you (almost-full first) → Happening today → shortcuts.
- **Resources assistant** answers from `docs/resources.md` plus deanza.edu search, with a local keyword fallback when Claude is unavailable.

## Done

All tested in the browser against the real Supabase project during the hackathon.

- [x] Project setup: 4-tab nav, schema, and seed (8 students, 16 activities).
- [x] Registration: email + password + 18+ (DB-enforced), log in/out, protected pages.
- [x] Onboarding: grouped interests with search → photo upload → name, major, bio, with progress bar and redirect-back.
- [x] Activities: day-grouped list, chips + search, `/activities/upcoming`, detail with who's going and map links, join/leave, create (campus or off-campus with address suggestions), host-only delete.
- [x] Home: Your upcoming (4 + View all), For you, Happening today, shortcuts.
- [x] Account: edit profile, photo, and interests (sticky Save), log out, delete own account (`delete_own_account()` + avatar cleanup).
- [x] Activity group chat (Oct 20, no AI facilitator yet): min–max people on create, chat opens at the min, live updates. Tested in the browser.
- [x] Chats tab (Oct 20): `/chats` list (latest first, last-message preview, unread dot) and `/chats/[id]`. Unread dot on the tab. **Not yet tested in the browser.** Needs `schema.sql` re-run (`chat_reads`, `my_chats`, `mark_chat_read`).
- [x] Resources: chat at `/resources` via `POST /api/navigator`, with fallback for food, bikes, and computers.

## Known issues (most severe first)

1. **`/api/navigator` has no auth and no rate limit.** The proxy skips `/api/*`, so anyone with the URL can spend Claude credits. Blocker for launch.
2. **Fallback bike answer is outdated.** `askNavigatorMock` in `lib/navigator/ai.ts` still offers e-bikes. The official page now says e-bikes are unavailable until about Winter 2027 (see `docs/resources.md`).
3. **Default model ID** in `lib/navigator/ai.ts` (`claude-sonnet-5`) should be checked against current Claude model IDs.
4. **Seed is demo-only:** shared password, pravatar photos, `example.com` emails. It must never run against production. There is no separate dev/prod Supabase project yet.
5. **Email confirmation is off** in Supabase (hackathon setting). Anyone can register with any email.
6. **Most `data/contacts.json` entries are unverified.** Only `verified: true` ones (Roary's Market) are shown.
7. **`npm run lint` fails** on the stale mock `app/home/page.tsx`, which also duplicates Home at `/home`.
8. **Re-run `supabase/schema.sql` before pulling the chat changes.** Without `min_people`, every activity query fails. Without `my_chats`, the Chats page errors.
9. Chat: no report/block or message delete yet, and only the latest 200 messages are shown. The host can still change `min_people` through the API (no edit UI); lowering it won't open the chat until the next join.
10. Not yet checked: the Memorial Park seed address (21221 Stevens Creek Blvd), and two people taking the last spot at the same moment.
11. By design but may surprise users: search ignores the selected interest chip.
12. Dev-only: stale CSS after editing `app/globals.css` (restart dev). `data-cursor-ref` hydration warnings come from Cursor's browser.

## Roadmap (in order)

1. **Production hardening**
   - Require a signed-in user on `/api/navigator`, and add a per-user rate limit.
   - Delete `app/home/` so lint and build pass. Update the fallback answers to match `docs/resources.md`.
   - Choose hosting (Vercel is the simplest fit) and set up separate dev and prod Supabase projects. Seed runs only on dev.
   - Turn on email confirmation. Set the Supabase site URL and redirect URLs for the deployed domain.
   - Add a privacy policy and terms page. Users share photos and meet in person.
2. **Student verification:** allow sign-up only with De Anza / FHDA student email domains (confirm the exact domain with the college), plus email confirmation.
3. **Password reset:** Supabase reset email → set-new-password page.
4. **Report and block:** report an activity or user, block a user (hide their activities, prevent joins), and a minimal review path for reports.
5. **Activity group chat:** basic chat done (see Done). Next: AI facilitator in the chat.
6. **Quality:** Supabase CLI migrations instead of one `schema.sql`, a basic test suite and CI (lint + build), error monitoring, better loading and empty states, and a real-phone check of every screen.
