---
name: ship-check
description: Verification steps and the required change summary for DeAnza Link. Use before saying a task is done, before committing or opening a PR, and when writing the summary after any change.
---

# Before you say "done"

1. `npx tsc --noEmit`: types check.
2. `npm run format && npm run lint && npm run build`: all three must pass before pushing. `build` also catches missing `<Suspense>` boundaries.
3. Load the changed page in the browser (`npm run dev`). If you touched shared code, walk the core flow: sign up → onboarding → Home → open an activity → "I'm down" → it shows in Your upcoming → Resources "Where can I get free food?".
4. Update `docs/PROGRESS.md` in the same change if you finished a feature, fixed a known issue, found a new one, or made a decision others should know.
5. New env var → add the name (no value) to `.env.example`. New dependency → say why in the summary.

Say plainly what you couldn't verify (e.g. "didn't test on a real phone").

# Change summary (required after every change)

1. **What I did:** 1–2 sentences.
2. **Files changed:** each file with a few words on its purpose.
3. **How it works:** the flow in plain words (e.g. "User submits form → server action validates → saves to DB → redirects to onboarding"). Add a short example if it helps.
4. **How to test it:** exact steps in the browser.
5. **Heads-up:** anything unfinished, shared files touched (schema, layout/nav, config, shared types), new env vars or dependencies.

Keep it short. Don't paste the code back.
