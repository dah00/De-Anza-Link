---
name: resources-assistant
description: Rules and architecture for the Resources AI assistant (Campus Navigator). Use when changing app/(tabs)/resources, app/api/navigator, lib/navigator/, docs/resources.md, data/contacts.json, or data/buildings.json, or when adding or verifying campus facts.
---

# Resources assistant

## Non-negotiable rules

The assistant must not make up campus information. A wrong location or wrong hours hurts students more than "I don't know."

- Answers come only from `docs/resources.md` (in the system prompt) and deanza.edu pages found by the restricted web search.
- If the answer isn't there, say so and point to the relevant office or deanza.edu page. **Never invent** names, rooms, hours, phone numbers, emails, or links.
- 2–4 short, friendly sentences. Include where and when if known.
- Only De Anza resources and student life. Politely decline anything else.
- Claude is called only from the server. `ANTHROPIC_API_KEY` stays in server env vars.
- API failures show a friendly message, never a crash.

## Pipeline (`POST /api/navigator`)

1. `app/api/navigator/route.ts` validates `question` and `history` (≤8 messages, each <1500 chars).
2. `lib/navigator/prompt.ts` reads `docs/resources.md` once at startup into `CAMPUS_NAVIGATOR_SYSTEM_PROMPT`. **Restart the server after editing resources.md.**
3. `lib/navigator/ai.ts` → `askNavigator()` calls Claude:
   - model `ANTHROPIC_MODEL`, or the default in that file
   - `web_search` tool limited to `deanza.edu`, max 3 uses, 40s timeout
4. `lib/navigator/validate.ts` parses the JSON reply into `NavigatorResponse` (`lib/navigator/types.ts`) and drops non-deanza.edu URLs.
5. The route adds a building/map match (`lib/navigator/buildings.ts`, `data/buildings.json`). It replaces any contact with a trusted one from `data/contacts.json` (`lib/navigator/contacts.ts`).

**Fallback:** `askNavigatorMock()` is a keyword-matched local answerer (food, bikes, computers, commuting, PIQ). It runs when:

- `USE_MOCK_AI=true`
- the key is missing
- the call fails or validation fails

Its answers are **hard-coded in `ai.ts`**. When a fact in `resources.md` changes, update the matching mock answer in the same change.

## Adding or updating a fact

- Every section in `docs/resources.md` needs a `Source:` deanza.edu link and a `Last checked:` date. Hours are quarter-specific; say which quarter.
- Only add what you read on an official page. If sources disagree, use the most recent official page and note the conflict in `docs/resources.md`.
- deanza.edu blocks automated fetches (Cloudflare 403). Check pages in a browser, or use search snippets from deanza.edu and mark them "confirm on the page".
- In `data/contacts.json`, only entries with `verified: true` are shown. Set it only after checking the office's official page, and record where in `data/NOTES.md`.
