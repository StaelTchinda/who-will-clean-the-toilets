# Nos Rôles

A two-partner web questionnaire that helps couples talk about household roles **before** daily chores become a source of conflict. Inspired by Gary Chapman’s book [*Les toilettes ne se nettoient pas toutes seules*](https://www.garychapman.org/) (and his “four angles, six domains” framework).

Each partner answers **53 swipe-based questions** (~20 minutes) on their phone. When both finish, the app shows **convergences**, **divergences**, and a **suggested task split** based on talents and preferences—not inherited habits.

## Features

- **Session pairing** — Partner A creates a session and shares a 4-character code; Partner B joins on another device.
- **Swipe UI** — Answer by swiping or tapping (up / right / down / left), faster than a long form.
- **Four analysis angles** — Environment, Talent, Preference, Value (`src/data/angles.json`).
- **Six domains** — Housekeeping, cooking, finances, logistics, children, values (`src/data/domains.json`).
- **Live sync** — Progress and answers sync via Supabase Realtime while both partners answer.
- **Results** — Per-question alignment, grouped by domain, plus task assignment suggestions (`src/lib/analysis.ts`).

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) (Radix) |
| Data | [Supabase](https://supabase.com/) (Postgres + Realtime) |
| Build | Vite 7, `@lovable.dev/vite-tanstack-config` |
| Deploy target | Cloudflare Workers (`wrangler.jsonc`) |
| Package manager | [Bun](https://bun.sh/) (`bun.lock`) |

## Prerequisites

- **Bun** 1.x (recommended; the repo uses `bun.lock`)
- A **Supabase** project with the schema applied (see below)
- **Node.js** 22+ is a reasonable fallback if you use `npm`/`pnpm`, but Bun is what the lockfile targets

## Local setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd nos-roles
bun install
```

### 2. Environment variables

Create a `.env` file at the project root (see `.env` for variable names; **do not commit secrets** in a public repo—prefer `.env.example` + gitignored `.env`):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
```

Optional (SSR / server):

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<same-publishable-key>
```

The client reads `VITE_*` in the browser and falls back to `SUPABASE_*` on the server (`src/integrations/supabase/client.ts`).

### 3. Database

Apply the migration in `supabase/migrations/` to your Supabase project (SQL editor or Supabase CLI):

- Tables: `sessions`, `answers`, `progress`
- Realtime enabled on all three tables

```bash
# If you use Supabase CLI locally:
supabase link --project-ref <project-ref>
supabase db push
```

**Note:** Current RLS policies allow broad read/write for `anon` and `authenticated` users. That keeps the “no login, just a code” flow simple but is **not** suitable for production without tightening policies.

### 4. Run the dev server

```bash
bun run dev
```

Open the URL Vite prints (often `http://localhost:5173`).

### 5. Try the flow

1. Open `/` → **Démarrer un questionnaire** → enter a name and children preference.
2. Share the 4-letter code with a second browser/device → **Rejoindre avec un code**.
3. Each partner completes the questionnaire at `/s/:code`.
4. When both are done, results appear automatically.

Concept background: `/foundations`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Vite dev server |
| `bun run build` | Production build |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview production build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier write |

## Project structure

```
src/
  routes/           # Pages: home (/), foundations, session (/s/:code)
  components/       # UI (shadcn) + SwipeCard, ResultsView
  data/             # questions, tasks, domains, angles (JSON)
  lib/              # dataset, session API, analysis engine
  integrations/     # Supabase client, auth middleware
supabase/
  migrations/       # Postgres schema + Realtime
```

Question content and scoring logic live in JSON + `src/lib/analysis.ts`; session CRUD in `src/lib/session.ts`.

## Deployment (Cloudflare)

The app is configured for Cloudflare Workers via `@cloudflare/vite-plugin` and `wrangler.jsonc` (`main`: `src/server.ts`).

```bash
bun run build
# Deploy with Wrangler (configure account + secrets separately)
npx wrangler deploy
```

Set `VITE_SUPABASE_*` (or worker secrets) in your Cloudflare environment for production.

## Content & methodology

- **Questions:** `src/data/questions.json` (53 items; children domain omitted if both partners answer “no”).
- **Method:** Four angles × six domains, aligned with Chapman’s household-role framework.
- **UI copy:** French throughout the product.

## License

Add your license here (none in the repo yet).
