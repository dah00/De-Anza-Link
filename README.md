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
3. **Email confirmation (code, not link).** Sign-up only accepts `@deanza.edu` / `@fhda.edu` emails (and their subdomains), then asks for a code from the email at `/verify`.
   - Authentication → Sign In / Providers → Email: turn **Confirm email** on.
   - Authentication → Emails → **SMTP Settings**: set up custom SMTP first. Supabase only allows editing templates with custom SMTP. Dev: a team Gmail with an app password (`smtp.gmail.com`, port 465). Launch: Resend (`smtp.resend.com`, port 465, user `resend`, password = API key) on our own verified domain. The SMTP password lives only in the Supabase dashboard, never in the repo.
   - Authentication → Emails → **Confirm signup** template: replace the link with the code. For example: `<h2>Confirm your DeAnza Link account</h2><p>Your code is <strong>{{ .Token }}</strong>. It expires soon.</p>`. Our app has no page for the default link, so the link alone won't work.
   - Supabase's built-in email sender only delivers to your project's team members and sends just a few emails an hour. Real students need **custom SMTP** (Authentication → Emails → SMTP Settings). See `docs/PROGRESS.md`.
   - On a dev project you can turn **Confirm email** off for faster testing. Sign-up then skips `/verify`. Keep it on in production.
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
