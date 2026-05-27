// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import istanbul from "vite-plugin-istanbul";

// Only activate when the e2e coverage script sets the flag. Adding it
// unconditionally would slow normal `bun run dev` (instrumentation is ~2x)
// and pollute window.__coverage__ in production builds.
const E2E_COVERAGE = process.env.VITE_E2E_COVERAGE === "1";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: E2E_COVERAGE
    ? {
        plugins: [
          istanbul({
            // Instrument app source only. Exclude tests, configs, generated
            // routeTree, server entry (Node-only), and node_modules.
            include: "src/**/*.{ts,tsx}",
            exclude: [
              "node_modules",
              "tests",
              "src/routeTree.gen.ts",
              "src/server.ts",
              "src/start.ts",
              "**/*.stories.tsx",
              "**/*.test.ts",
              "**/*.test.tsx",
            ],
            extension: [".ts", ".tsx"],
            requireEnv: false,
            // Allow instrumenting in dev mode (default is build-only).
            forceBuildInstrument: true,
          }),
        ],
      }
    : undefined,
});
