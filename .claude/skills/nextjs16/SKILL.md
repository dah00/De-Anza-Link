---
name: nextjs16
description: Next.js 16 rules and app structure for DeAnza Link (cacheComponents/Suspense, proxy.ts, PageProps, server actions, route groups). Use before writing or changing pages, layouts, route handlers, or server actions.
---

# Next.js 16 in this repo

This is not the Next.js in most training data. Before using an API from memory, read the guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Rules that break the build

- `cacheComponents: true` (`next.config.ts`). Anything that reads cookies, `params`, or `searchParams`, and `usePathname()` on dynamic routes, must render inside `<Suspense>`. `next build` fails if you forget.
- Page props use the global `PageProps<"/route">` type.
- Route protection lives in `proxy.ts` (the old `middleware.ts`), which calls `updateSession` in `lib/supabase/proxy.ts`.

## Request gating

`proxy.ts` refreshes the Supabase session on every request **except `/api/*`, `_next`, and images**, then:

- signed out → `/login` (except on `/login`, `/signup`, and `/verify`)
- signed in, `profiles.onboarding_completed = false` → `/onboarding`
- onboarded and on `/login`, `/signup`, or `/onboarding` → `/`

Route handlers under `app/api/` get **no** auth from the proxy. Check the user yourself (`createClient()` from `@/lib/supabase/server`, then `auth.getUser()`) if the route needs it.

## Route groups

- `app/(auth)/`: `/login`, `/signup`, `/verify` (email confirmation code), and the `signUp`/`logIn`/`logOut`/`verifyEmail`/`resendCode` actions. No nav. The email being confirmed travels in the httpOnly `pending_email` cookie, not the URL.
- `app/onboarding/`: 3 steps (interests → photo → name, major, bio).
- `app/(tabs)/`: everything with the bottom nav. Home is `app/(tabs)/page.tsx`, plus `activities/` (list, `upcoming/`, `[id]/`, `new/`), `chats/` (list, `[id]/` group chat), `account/`, `resources/`. The tabs layout also renders `ChatUpdates` (one Realtime subscription on `messages` that calls `router.refresh()`) and the Chats unread dot.
- `app/api/`: `navigator` (Resources assistant), `address-suggest` (geocoding proxy).
- Redirects: `/navigator` → `/resources` (`next.config.ts`), `/profile` → `/account`.

## Reads and writes

- Reads happen in server components.
- Writes go through server actions (`"use server"` files: `app/(auth)/actions.ts`, `app/onboarding/actions.ts`, `app/(tabs)/account/actions.ts`, `lib/activity-actions.ts`).
- Server actions:
  - validate every input on the server, even if the form already checked it
  - return `{ error: string }` for messages the user should see
  - on success, call `refresh()` from `next/cache` or `redirect()`
- Prefer server actions over new API routes. Use a route handler only for client-side fetches that aren't form writes (e.g. chat, autocomplete).
