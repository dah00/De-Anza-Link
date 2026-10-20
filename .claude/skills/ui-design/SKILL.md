---
name: ui-design
description: DeAnza Link UI and copy rules. Use when building or changing any screen, component, layout, styling, or user-facing text.
---

# UI design: simple and human-made

The app should look like a small team designed it by hand, not like a generic AI template.

## Look

- Off-white background, one accent (the green `primary` theme color in `app/globals.css`), dark gray text. Plenty of whitespace.
- Simple borders or very light shadows, modest corner rounding, one font family, a few clear text sizes.
- **Never:** purple/blue gradients, glowing or glassy cards, sparkle icons, emoji in headings, oversized hero sections, marketing copy ("Unlock your potential").
- Icons (`lucide-react`) only for navigation and actions, not decoration.

## Layout

- Mobile first. Tab pages sit in the `max-w-md` column from `app/(tabs)/layout.tsx`, with `BottomNav` underneath.
- Bottom nav has 4 tabs: Home · Activities · Resources · Account. Don't add tabs without a team decision.

## Components

- Reuse before creating: `components/ui/` (shadcn on Base UI: `Button`, `Input`, `Card`, `Badge`), plus `ActivityCard`, `Avatar` (falls back to initials when an image fails), `AvatarStack`, `JoinButton`.
- Add shadcn components with `npx shadcn@latest add <name>`. Merge classes with `cn()` from `lib/utils.ts`.
- Same button, input, and card styles on every screen.

## Copy

- Short, specific, and casual, the way a person talks: "I'm down", "Can't make it", "Who's going", "Pick a few things you're into".
- Errors are plain and tell the user what to do: "Give it a name.", "Keep the name under 80 characters."
- Every list needs an empty state that suggests the next step (e.g. "Start one").
