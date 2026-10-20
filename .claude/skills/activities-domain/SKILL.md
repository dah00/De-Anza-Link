---
name: activities-domain
description: Business rules for activities, Home, interests, locations, and times in DeAnza Link. Use when working on activity create/join/leave/delete, the Activities or Home tabs, interests, campus spots, off-campus addresses, or date/time handling.
---

# Activities and Home

## Fixed lists

- Interests: `lib/interests.ts` (grouped). Campus spots: `lib/locations.ts`.
- Validate with `isInterest()` and `isCampusLocation()` on the server before saving.

## Time

- All dates and times use campus time (America/Los_Angeles), never the browser's or the server's zone.
- Use the helpers in `lib/time.ts` ("Today"/"Tomorrow" labels, and `campusDateTimeToDate()` for form day + time → timestamp, DST-safe). Don't use raw `new Date()` formatting.
- Activities can be created up to 60 days ahead (`MAX_DAYS_AHEAD` in `lib/activity-actions.ts`).

## Locations (safety rule)

- A location is either a campus spot from the fixed list, or an off-campus **public** place name plus an address. The create form says "public place, no home addresses".
- Address suggestions come from `GET /api/address-suggest` (`lib/address-suggest.ts`). It tries Photon first, then Nominatim. The browser never calls these services directly. If both fail, a typed address still works.
- Every activity gets Google and Apple Maps links (`lib/maps.ts`). Campus spots use De Anza's address.

## Actions (`lib/activity-actions.ts`)

- `createActivity` (the host joins automatically), `joinActivity`, `leaveActivity`, `deleteActivity` (host only).
- Capacity and "already started" are enforced by the DB trigger. Show its errors as friendly messages.
- Queries live in `lib/activities.ts` (`Activity` type, `getUpcomingActivities`, `getActivity`).

## Activities tab

- The list is grouped by day, with interest chips and a search bar.
- Chips only show interests that have upcoming activities.
- Search matches every typed word against title, interest, place, address, and description. It ignores the selected chip, on purpose.
- No results → "Start one" opens the create form with the interest pre-filled.
- `/activities/upcoming` shows all of the user's upcoming activities.

## Home (never empty)

1. **Your upcoming**: first 4, then "View all".
2. **For you**: activities in the user's interests, almost-full first ("needs 1 more" is a strong nudge).
3. **Happening today**: everything else today that isn't already in For you.
4. Shortcuts to create an activity and to Resources.

## Core flow that must always work

Sign up → onboarding → Home shows suggestions → open one → "I'm down" → it shows in Your upcoming → Resources answers "Where can I get free food?"
