# DeAnza Link: Project Brief for AI Agents

Applies to every agent and teammate on this repo. Read [`docs/PROGRESS.md`](docs/PROGRESS.md) for current status, known issues, and the roadmap.

## What and why

DeAnza Link is a mobile-friendly web app that helps De Anza College students meet in person through small, interest-based activities ("Psych coffee, Thu 2pm, Campus Café, 3/5 spots"). Many students want to meet people but wait for someone else to make the first move. Here the first step is one tap, **I'm down**, and the activity gives people something to talk about.

**Phase:** the 24-hour hackathon (Oct 17, 2026) is over. We're getting ready for real students. **Reliability, safety, and privacy come before new features.** Prefer the simplest approach that works in production.

## Scope

**Built:** sign up (18+) / log in / log out · onboarding (interests → photo → name, major, bio) · Activities (browse, filter, search, detail, create, join/leave, delete) · Home (upcoming + suggestions, never empty) · Resources AI assistant · Account (edit profile and interests, delete account).

**Roadmap (approved, in order; see PROGRESS.md):** production hardening → student verification (De Anza email) → password reset → report/block users → activity group chat.

**Out of scope:** free-time grid / schedule matching, "Open to Meet" badges / weekly intro groups, AI facilitator in chats, push notifications, native mobile app. If a task needs one of these, stop and say so instead of building it.

## Safety rules (non-negotiable)

- Users confirm they're 18+ at sign-up. The database enforces it.
- Activity locations are a campus spot from the fixed list or an off-campus **public** place. No home addresses.
- Only signed-in users can see profiles, activities, and chats.
- Users can only edit or delete their own data. This is enforced by Supabase RLS, not just the UI.
- Secrets live only in server env vars (`.env.local`, host dashboard). Never use the Supabase service-role key in the app. `.env.example` lists names only.
- The Resources assistant never invents campus facts (see `resources-assistant` skill).

## Tech stack

Next.js 16 (App Router, Turbopack) + TypeScript · Tailwind v4 + shadcn/ui (Base UI) · Supabase (Postgres + RLS, email/password auth, Storage) · Claude API, server only · Hosting: **not decided** · Default to TypeScript. A separate service (e.g. Python) needs a team decision.

Don't add a library, service, or language without saying so and explaining why.

## How to work

- **Stay in your area.** Change only what the task needs. No drive-by refactors, renames, or reformatting. Teammates are editing in parallel.
- **Shared code is shared.** Call out changes to the schema, shared types, layout/navigation, or config.
- **Small, working changes.** Every change leaves the app running. Finish one thing before starting another.
- **Ask when unclear** (one line) before writing code.
- **Before "done":** type-check, lint, build, and load the page. After every change, give the 5-part summary (What I did / Files changed / How it works / How to test it / Heads-up). Details are in the `ship-check` skill.
- **Keep `docs/PROGRESS.md` current** in the same change.

## Skills (detailed rules, read when relevant)

Claude Code loads these automatically. Other agents: open the file when the task matches.

| Skill                                                                | Read when working on                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`ui-design`](.claude/skills/ui-design/SKILL.md)                     | Any screen, component, styling, or user-facing copy                 |
| [`nextjs16`](.claude/skills/nextjs16/SKILL.md)                       | Pages, layouts, route handlers, server actions, auth redirects      |
| [`supabase-data`](.claude/skills/supabase-data/SKILL.md)             | Schema, RLS, queries, Storage, seed data                            |
| [`activities-domain`](.claude/skills/activities-domain/SKILL.md)     | Activities, Home, interests, locations, dates and times             |
| [`resources-assistant`](.claude/skills/resources-assistant/SKILL.md) | Resources chat, `lib/navigator/`, `docs/resources.md`, `data/`      |
| [`ship-check`](.claude/skills/ship-check/SKILL.md)                   | Before saying done, committing, or opening a PR; the change summary |

## Team ownership

> **Team: fill in.**

| Area                                  | Owner  |
| ------------------------------------- | ------ |
| Auth, onboarding, Account             | _name_ |
| Activities, Home                      | _name_ |
| Resources AI assistant, resource data | _name_ |
| Chat, safety (report/block)           | _name_ |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
