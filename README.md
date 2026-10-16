# DeAnza Link

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui.

## Setup

Use Node 24 (`nvm use`).

```bash
npm install
cp .env.example .env.local
npm run dev    # http://localhost:3000
```

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
