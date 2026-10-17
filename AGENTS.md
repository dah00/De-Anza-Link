# DeAnza Link: Hackathon Project Brief for AI Agents

Read this whole file before doing any task. It applies to every agent and every teammate on this repo.

**Then read [`docs/PROGRESS.md`](docs/PROGRESS.md)** for the current state of the build: architecture, key decisions, conventions, what's done, known bugs, and next steps. This file is the brief and rarely changes; `PROGRESS.md` is the status and changes often. When you finish a feature, fix a known bug, or make a decision others should know about, update `PROGRESS.md` in the same change.

## The situation

- **What:** DeAnza Link, a mobile-friendly web app that helps De Anza College students meet in person through small, interest-based activities.
- **Event:** De Anza Hackathon, 24 hours. **Demo deadline: Saturday, October 17, 2026 at 2:00pm.**
- **Team:** 3 people working in parallel, each with their own AI agent, on the same repo.
- **Priority:** a working, polished demo of the core flow beats a long feature list. When in doubt, choose the **simplest approach that works reliably in a live demo**.

## Why the app exists

Many students want to meet people but wait for someone else to make the first move. DeAnza Link makes the first step take one tap: students find a small activity that matches their interests ("Psych coffee, Thu 2pm, Campus Café, 3/5 spots") and tap **I'm down**. The activity is the reason to talk, so nobody has to start a conversation from nothing.

## Scope

### ✅ In scope (in priority order)

1. **Registration and login.** Sign up with email and password, log in, log out. Students must confirm they are 18 or older at sign-up.
2. **Onboarding.** Right after sign-up, a few short steps: choose interests and hobbies (from a fixed list), upload a profile photo, then add display name, major, and a short bio. Then go to Home. Users who haven't finished onboarding are sent back to it when they log in.
3. **Activities tab.** Browse activities, filter by interest, view an activity's details, **create** an activity (title, interest, date/time, location: a campus spot or an off-campus public place with an address, max people), and **join/leave** with an "I'm down" button. Show spots filled ("3/5") and who is going.
4. **Home tab.** The user's upcoming activities, plus suggested activities that match their interests. Never empty: show suggestions for new users.
5. **Resources tab: De Anza AI assistant.** A chat where students ask questions about De Anza resources (bike rental, free food, computer loans, etc.). See the rules below.
6. **Account tab.** View and edit profile and interests, log out.
7. **Activity group chat (lower priority).** A simple chat for people who joined an activity. Build only after 1–6 work.

### ❌ Out of scope (do not build, even if it seems easy)

- Free-time grid and schedule matching
- "Open to Meet" badge and weekly intro groups
- Automatic AI facilitator in chats (stretch goal only, if everything else is done)
- Push or email notifications
- **Verifying that users are De Anza students** (school email check, student ID, etc.). Planned for after the hackathon. For the demo, any email can register.
- Password reset, admin dashboard, moderation queue
- Native mobile app

If a task seems to need an out-of-scope feature, stop and say so instead of building it.

## App structure

Bottom navigation with 4 tabs: **Home · Activities · Resources · Account**.
Screens outside the tabs: Sign up, Log in, Onboarding, Activity detail, Create activity, Activity chat.

**Demo path that must always work:**
Sign up → onboarding → Home shows suggested activities → open one → tap "I'm down" → it appears in "Your upcoming activities" → Resources: ask "Where can I get free food?" and get a useful answer.

## Tech stack

> **Team: confirm or edit this section before starting, so every agent uses the same choices.**

- **Framework:** Next.js (App Router) + TypeScript, for both the frontend and the backend (API routes / server actions)
- **Styling:** Tailwind CSS, mobile-first (design for a phone screen width first)
- **Database and auth:** Supabase (Postgres + email/password auth). Use `lib/supabase/server.ts` on the server and `lib/supabase/client.ts` in the browser. Schema lives in `supabase/schema.sql`. Route protection and the onboarding redirect live in `proxy.ts`.
- **Profile photos:** Supabase Storage, `avatars` bucket, one folder per user id
- **AI:** Claude API, called **only from the server** (API route or server action)
- **Hosting:** _fill in_
- **Python:** allowed if a task truly needs it (e.g., a teammate is much faster in Python for the Resources assistant). If used, keep it as **one small separate service** with a clear API that the Next.js app calls, and document how to run it in the README. Default to TypeScript, because a second language means a second server to run, deploy, and debug during the demo.

Do not add a new library, service, or language without saying so in your response and explaining why.

## UI design: simple and human-made

The app should look like a small team designed it by hand, not like a generic AI-generated template.

- **Keep it plain.** White or off-white background, one accent color, dark gray text. Plenty of whitespace.
- **Avoid "AI look" clichés:** no purple/blue gradients, no glowing or glassy cards, no sparkle ✨ icons, no emoji in headings, no oversized hero sections, no "Unlock your potential"-style marketing copy.
- **Restrained styling.** Simple borders or very light shadows, modest corner rounding, one font family, a few clear text sizes.
- **Write like a person.** Short, specific, casual labels ("I'm down", "Who's going", "Pick a few things you're into"), not buzzwords.
- **Icons only when they help.** Use them for navigation and actions, not decoration.
- **Consistency over flair.** Reuse the same button, input, and card styles on every screen.

## Data (keep it minimal)

- **User / Profile:** id, email, display_name, major, bio, photo_url, is_18_plus, interests[], onboarding_completed
- **Interest:** fixed list (e.g., Psychology, Soccer, Chess, Computer Science, Music, Gaming, Art, Fitness)
- **Activity:** id, title, description, interest, starts_at, location (a campus spot from a fixed list, or an off-campus place name), address (only for off-campus places), max_people, creator_id
- **Participation:** activity_id, user_id, joined_at
- **Message** (if chat is built): id, activity_id, user_id, body, created_at

Seed data: create realistic sample users and activities so the demo never shows empty screens.

## Resources AI assistant rules

This feature must not make up campus information. A wrong location or wrong hours in a live demo hurts more than "I don't know."

- Answers must come **only** from our resource data file (`docs/resources.md` or a similar file the team maintains), passed to Claude in the prompt.
- If the answer isn't in the data, the assistant says so and points the student to the relevant De Anza office or website listed in the data. **Never invent** names, locations, hours, phone numbers, or links.
- Keep answers short and friendly: 2–4 sentences, include where and when if known.
- Only answer questions about De Anza resources and student life. Politely decline unrelated requests.
- The API key lives in environment variables on the server. Never expose it to the client or commit it.
- If the API call fails, show a friendly error message instead of crashing.

## Build order: one step at a time

We build in this order and finish each step before starting the next:

1. **Project setup:** app runs, 4-tab navigation with placeholder pages, database and auth connected, seed data
2. **Registration:** sign up (with 18+ confirmation), log in, log out, protected pages
3. **Onboarding:** interests → photo → name, major, bio → Home
4. **Activities:** list + filter, detail, join/leave, create
5. **Home:** upcoming activities + suggestions
6. **Resources AI assistant**
7. **Account:** view/edit profile, log out
8. **Activity chat** (if time allows)
9. **Demo polish:** seed data, empty states, loading states, mobile layout check

Work only on the current step unless the teammate says otherwise. If a step depends on something not built yet, use a simple placeholder and say so.

## After every change: explain it

After each change, always give a short explanation in this format:

1. **What I did:** 1–2 sentences.
2. **Files changed:** list each file with a few words on its purpose.
3. **How it works:** a simple, clear explanation of the flow (e.g., "User submits form → server action validates → saves to database → redirects to onboarding"). Add a short example when it helps.
4. **How to test it:** exact steps to try it in the browser.
5. **Heads-up:** anything not done, any shared file changed, any new environment variable or dependency.

Keep it concise. No long essays, no repeating the code back.

## How agents should work on this team

- **Stay in your task's area.** Only change files needed for the current task. Do not refactor, rename, or reformat code you weren't asked to touch. Teammates are editing other parts of the repo at the same time.
- **Shared code is shared.** Changes to shared types, the database schema, layout/navigation, or config affect everyone. Point them out clearly in your response so the teammate can tell the team.
- **Keep changes small and working.** Each change should leave the app running. Prefer finishing one feature completely over starting several.
- **Check before saying "done."** Make sure the code type-checks and the page loads. Mention anything you couldn't verify.
- **Ask when unclear.** If a request is ambiguous or conflicts with this file, ask in one line before writing code.
- **Never commit secrets.** No API keys, database URLs, or passwords in code. Use `.env.local` and keep `.env.example` updated with variable names only.

## Basic safety (even for a demo)

- Users must confirm 18+ at sign-up.
- Activity locations are either a campus spot from a fixed list or an off-campus public place (park, café, court). The create form tells users not to use home addresses.
- Only signed-in users can see profiles, activities, and chats.
- Users can only edit or delete their own profile and activities.

## Team ownership

> **Team: fill in so agents know who owns what.**

| Area                                  | Owner  |
| ------------------------------------- | ------ |
| Auth, onboarding, Account             | _name_ |
| Activities, Home                      | _name_ |
| Resources AI assistant, resource data | _name_ |
| Chat (if time allows)                 | _name_ |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
