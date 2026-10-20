# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Status, known issues, and roadmap: `docs/PROGRESS.md`. Detailed rules live in the project skills in `.claude/skills/` (UI, Next.js 16, Supabase, activities, Resources assistant, ship-check). Load the matching one before working in that area.

## Commands

Node 24 (`nvm use`).

```bash
npm run dev                  # http://localhost:3000
npx tsc --noEmit             # type-check
npm run lint                 # eslint
npm run format               # prettier (with tailwind class sorting)
npm run build                # also catches missing <Suspense> boundaries
```

There is no test suite yet. Verify in the browser. Setup (env vars, Supabase SQL, seed accounts) is in `README.md`.
