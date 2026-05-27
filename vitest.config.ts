import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Two projects share one Vitest run so a single `vitest run --coverage`
// produces ONE merged coverage report for both halves of the test surface:
//   • `unit` — `src/**/*.{test,spec}.ts` in node env (current Vitest tests)
//   • `storybook` — every `*.stories.tsx` rendered in a real Chromium via
//     @storybook/addon-vitest's plugin (reads .storybook/main.ts so its
//     Supabase mock alias is in effect)
//
// Standalone — deliberately does NOT reuse the project's vite.config.ts,
// which pulls in tanstackStart + cloudflare + SSR via
// @lovable.dev/vite-tanstack-config and would break under the test runner.
export default defineConfig({
  test: {
    reporters: process.env.CI
      ? ["default", ["junit", { outputFile: "test-results/junit.xml" }]]
      : ["default"],
    coverage: {
      // Istanbul because addon-vitest's browser instrumentation also uses
      // istanbul under the hood — keeping providers aligned avoids merge
      // surprises.
      provider: "istanbul",
      reportsDirectory: "coverage",
      reporter: ["text", "text-summary", "json", "json-summary", "lcov"],
      // Coverage scope: project source only. Tests, stories, fixtures, the
      // shadcn UI primitives, generated files, and the Supabase types are
      // excluded — they inflate the denominator without telling us anything
      // about the code we actually wrote.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.stories.{ts,tsx}",
        "src/test/**",
        "src/components/ui/**",
        "src/integrations/supabase/types.ts",
        "src/integrations/supabase/client.ts",
        "src/routeTree.gen.ts",
        "src/router.tsx",
        "src/server.ts",
      ],
    },
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.{test,spec}.ts"],
          globals: false,
        },
      },
      {
        // storybookTest reads .storybook/main.ts, so the Supabase mock alias
        // and the RouterDecorator wrap each story exactly like the browser.
        plugins: [
          tsconfigPaths(),
          storybookTest({
            configDir: path.resolve(__dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          // Run stories in a real Chromium via Playwright — same engine the
          // dev preview uses, so styling and refs behave identically.
          browser: {
            enabled: true,
            // Vitest 4 expects a provider factory rather than the string
            // "playwright". `@vitest/browser-playwright` wraps Playwright's
            // chromium for the browser-mode runner.
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [path.resolve(__dirname, ".storybook/vitest.setup.ts")],
        },
      },
    ],
  },
});
