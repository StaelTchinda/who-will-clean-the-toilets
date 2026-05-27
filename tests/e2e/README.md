# End-to-end tests

Two-partner flow driven by Playwright against a **local** Supabase stack.
Zero traffic to a hosted project; the local stack exercises the real
`@supabase/supabase-js` client, real Postgres + RLS, and real Realtime
websockets.

## Prerequisites (one time)

- Docker Desktop running (the Supabase CLI brings up its own containers).
- The repo has all needed devDeps already: `supabase`, `@playwright/test`,
  `pg`, and Playwright's Chromium binary (`bunx playwright install chromium`
  if you haven't already).

## Running

```bash
# 1. Start the local Supabase stack (first run: ~30s; subsequent: ~5s).
bun run e2e:supabase:start

# 2. Run the suite. Playwright spawns `vite dev --mode e2e` itself.
bun run test:e2e

# Or open the watch-mode UI:
bun run test:e2e:ui

# Reset DB schema if you've edited the migration:
bun run e2e:supabase:reset

# Stop the stack (rarely needed; faster iteration to leave it up):
bun run e2e:supabase:stop
```

## What's covered

[`two-partners.spec.ts`](./two-partners.spec.ts) — three scenarios:

1. **pairing** — Partner A creates a session, Partner B joins, A's
   `WaitingForJoin` flips into the questionnaire via the `sessions`
   postgres_changes realtime event.
2. **full flow** — Both partners answer all 46 questions (no children) in
   parallel browser contexts; both land on `ResultsView`; row counts in
   `answers` are asserted directly via `pg`.
3. **WaitingForFinish → ResultsView** — A finishes first, sees
   `WaitingForFinish`, then auto-transitions to `ResultsView` when B
   completes — again through realtime, without any reload.

## Coverage

The dev server, when run via `bun run dev:e2e`, sets `VITE_E2E_COVERAGE=1`,
which activates [vite-plugin-istanbul](https://github.com/iFaxity/vite-plugin-istanbul)
in [vite.config.ts](../../vite.config.ts). Every instrumented file
contributes to `window.__coverage__` in the browser.

The Playwright fixture in [helpers/coverage.ts](./helpers/coverage.ts) wraps
`browser.newContext` so it can read `window.__coverage__` from each context
just before close. Dumps land in `coverage-e2e/raw/<uuid>.json` — one per
browser context per test (six total for the current three-test, two-context
suite).

`bun run coverage:merge` (script: [scripts/merge-coverage.mjs](../../scripts/merge-coverage.mjs))
combines them with the Vitest unit coverage from `coverage/coverage-final.json`
and writes a unified istanbul report to `coverage-merged/` (json-summary, json,
lcov, browseable HTML). In CI, the `report` job uploads this as an artifact
_and_ posts a sticky PR comment via `davelosert/vitest-coverage-report-action`.

End-to-end locally:

```bash
bun run coverage         # unit + storybook → coverage/
bun run test:e2e         # e2e → coverage-e2e/raw/
bun run coverage:merge   # → coverage-merged/
open coverage-merged/lcov-report/index.html
```

## How it works

- **Two browser contexts per test.** Each context has its own `localStorage`,
  which is what the app uses (`rememberPartner`) to distinguish A from B on a
  given device. One context = one phone.
- **DB isolation.** [`helpers/db.ts`](./helpers/db.ts) opens a Postgres
  connection and `TRUNCATE`s the three tables in `beforeEach`. Cheaper than
  `supabase db reset` (~ms vs ~5s) and keeps the Realtime publication intact.
- **Answer selection.** [`helpers/questions.ts`](./helpers/questions.ts)
  re-implements the production `buildQuestionList` ordering so the test picks
  the same question for the same `index` the UI shows. Strategies:
  `convergent` (both pick answer[0]), `divergent` (A picks 0, B picks 1),
  `rotating`.
- **Selectors.** The four SwipeCard hint buttons all expose
  `aria-label={answer.label}` — `getByRole('button', { name })` is reliable
  even though the visible text uses a shortened label.
- **Hydration race fix.** TanStack Start SSRs the home page; clicking the
  CTA before React hydration attaches handlers is a no-op. The
  [`flow.ts:gotoHydrated`](./helpers/flow.ts) helper waits for `networkidle`
  before the first interaction.
- **SwipeCard lock window.** `SwipeCard.commit` locks the card for ~460ms
  while the answer animates off-screen. Clicking during that window is
  silently dropped. The `answerAllQuestions` loop polls the `X/Y` counter
  after each click and retries up to 5 times if it doesn't advance.

## What this caught the first time

A real prod bug in [src/routes/s.$code.tsx](../../src/routes/s.%24code.tsx):
after the last answer, `setIndex(total)` made `questions[index]` undefined,
and `q.id` was dereferenced one line before the bounds check, crashing the
session into the CatchBoundary. Fixed in the same commit as these tests.

## Adding new tests

- Always call `truncateAll()` (already done in the `beforeEach`).
- For new flows, lean on [`helpers/flow.ts`](./helpers/flow.ts) — don't
  duplicate the hydration + SwipeCard-lock workarounds inline.
- Use the `pg` helpers in [`helpers/db.ts`](./helpers/db.ts) to assert
  persisted state when the DOM is ambiguous; it's faster than asserting
  through Realtime echo.
