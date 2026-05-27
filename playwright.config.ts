import { defineConfig, devices } from "@playwright/test";

// Two-partner e2e suite. Drives the real Vite dev server against a *local*
// Supabase stack (see README.E2E.md). The stack is expected to be already
// running — `bun run e2e:supabase:start` brings it up out of band so cold
// startup (~30s the first time) doesn't slow every Playwright invocation.
//
// Tests share the database; `truncateAll` in beforeEach keeps them isolated
// and `fullyParallel: false` keeps the truncate predictable.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // In CI: github annotations for inline PR feedback, list for log
  // readability, junit so dorny/test-reporter can fold results into the PR
  // status checks, and html so the uploaded artifact is a self-contained
  // click-through (open: "never" suppresses the local browser auto-open
  // that would otherwise hang the CI step).
  reporter: process.env.CI
    ? [
        ["github"],
        ["list"],
        ["junit", { outputFile: "test-results/playwright-junit.xml" }],
        ["html", { open: "never" }],
      ]
    : "list",
  timeout: 60_000,
  expect: {
    // Realtime postgres_changes can take a beat to deliver locally.
    timeout: 10_000,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // `vite --mode e2e` auto-loads .env.e2e in addition to .env.
    // reuseExistingServer makes local iteration fast; CI starts fresh each run.
    command: "bun run dev:e2e",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  globalSetup: "./tests/e2e/global-setup.ts",
});
