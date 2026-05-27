import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Standalone config — deliberately does NOT reuse vite.config.ts, which uses
// @lovable.dev/vite-tanstack-config (tanstackStart + cloudflare + SSR entry)
// and would break under the test runner. We add only the @/* alias resolver,
// which also resolves @/data/* JSON imports used by src/lib/dataset.ts.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    globals: false,
    reporters: process.env.CI
      ? ["default", ["junit", { outputFile: "test-results/junit.xml" }]]
      : ["default"],
  },
});
