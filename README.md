# DeAnza Link

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui.

## Setup

Use Node 24 (`nvm use`).

```bash
npm install
cp .env.example .env.local
npm run dev    # http://localhost:3000
```

1. In `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API). `ANTHROPIC_API_KEY` is optional. Without it, Resources uses a small local fallback.
2. In the Supabase SQL Editor, run `supabase/schema.sql`. For a **dev** project only, also run `supabase/seed.sql`. Never seed production.
3. On a dev project, you can turn off Authentication → Sign In / Providers → Email → **Confirm email** for faster testing. Keep it on in production.
4. Seed accounts: `maya.chen@example.com` (and the other seed emails), password `deanzalink-demo`.

Before pushing: `npm run format && npm run lint && npm run build`.

## Where things go

- `app/`: pages and routes
- `components/ui/`: shadcn components. Add more with `npx shadcn@latest add card input dialog`
- `components/`: our own components
- `lib/utils.ts`: `cn()` for merging Tailwind classes
- Icons: `import { Search } from "lucide-react"`

## Team rules

- Keep `main` working. Use a branch per feature and pull often.
- Secrets go in `.env.local` only. Add the variable name to `.env.example`.
