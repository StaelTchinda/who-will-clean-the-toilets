import { test as base, expect, type BrowserContext } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// Where the raw window.__coverage__ dumps land. `scripts/merge-coverage.mjs`
// reads from here, runs istanbul merge, and writes the final report.
export const E2E_COVERAGE_RAW_DIR = join(process.cwd(), "coverage-e2e", "raw");

let dirEnsured = false;
function ensureRawDir() {
  if (dirEnsured) return;
  mkdirSync(E2E_COVERAGE_RAW_DIR, { recursive: true });
  dirEnsured = true;
}

/**
 * Pull whatever vite-plugin-istanbul has accumulated on a context's pages,
 * one file per page, just before the context closes. Each context is its
 * own JS realm with its own window.__coverage__ — we have to grab from
 * each one separately or we lose Partner B's coverage when only Partner A's
 * is read.
 */
async function dumpContextCoverage(context: BrowserContext): Promise<void> {
  for (const page of context.pages()) {
    if (page.isClosed()) continue;
    try {
      const coverage = await page.evaluate(() => {
        // vite-plugin-istanbul writes to window.__coverage__ on every
        // instrumented file execution. Undefined means either the page
        // navigated before any instrumented code ran, or the plugin isn't
        // active (e.g. someone forgot VITE_E2E_COVERAGE=1).
        // @ts-expect-error global is declared by the plugin
        return typeof window.__coverage__ !== "undefined"
          ? // @ts-expect-error global is declared by the plugin
            window.__coverage__
          : null;
      });
      if (!coverage || Object.keys(coverage).length === 0) continue;
      ensureRawDir();
      writeFileSync(join(E2E_COVERAGE_RAW_DIR, `${randomUUID()}.json`), JSON.stringify(coverage));
    } catch {
      // Coverage collection should never fail a test; the underlying
      // assertion result is what matters.
    }
  }
}

/**
 * Extended `test` that auto-collects coverage from every context any test
 * opens — both the implicit one Playwright creates per test AND every
 * extra `browser.newContext()` call (which this suite uses to model the two
 * partners as separate devices).
 *
 * Hook point: we monkey-patch `browser.newContext` once per worker to wrap
 * the returned context's `close` with a coverage-dump preamble. There's no
 * Playwright API to listen for "before context close" — `context.on('close')`
 * fires after the pages are already gone — so patching close is the only
 * reliable hook.
 *
 * Specs import { test, expect } from this file instead of @playwright/test.
 */
export const test = base.extend({
  // Worker-scoped: the patch only needs to happen once per browser instance.
  // Tuple form ([fn, opts]) sets the scope.
  // eslint-disable-next-line no-empty-pattern
  browser: [
    async ({ browser }, use) => {
      const originalNewContext = browser.newContext.bind(browser);
      browser.newContext = async (...args) => {
        const ctx = await originalNewContext(...args);
        const originalClose = ctx.close.bind(ctx);
        ctx.close = async (...closeArgs) => {
          await dumpContextCoverage(ctx);
          return originalClose(...closeArgs);
        };
        return ctx;
      };
      await use(browser);
    },
    { scope: "worker" },
  ],
  // Test-scoped: the default `context` Playwright auto-creates for tests
  // that take `page` won't go through our newContext patch. Wrap it here so
  // its coverage is dumped too. Tests in this suite don't actually use this
  // (they call browser.newContext themselves), but it's free insurance.
  context: async ({ context }, use) => {
    await use(context);
    await dumpContextCoverage(context);
  },
});

export { expect };
