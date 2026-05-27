import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Storybook runs its OWN Vite. We point it at .storybook/vite.config.ts (a
// stub) so the project's root vite.config.ts — which uses
// @lovable.dev/vite-tanstack-config (tanstackStart + cloudflare + SSR entry) —
// never enters Storybook's Vite graph. Storybook-specific tweaks
// (tailwind, supabase mock alias, etc.) live in viteFinal below.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  // @storybook/addon-vitest runs stories AS Vitest browser tests, which gives
  // us coverage natively through Vitest (`vitest run --coverage`). No
  // test-runner, no separate istanbul wiring, no merge step needed — Vitest's
  // own coverage provider sees both halves.
  addons: ["@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      // Point Storybook at an empty stub instead of the project's
      // vite.config.ts so the TanStack Start / Cloudflare / SSR plugins from
      // @lovable.dev/vite-tanstack-config never enter Storybook's Vite graph.
      // Absolute path — Vite's loadConfigFromFile resolves relative paths
      // against process.cwd(), which we cannot rely on here.
      // The Storybook type for framework.options doesn't surface
      // `viteConfigPath` yet (it's read by the builder via getBuilderOptions),
      // so we cast.
      viteConfigPath: path.resolve(__dirname, "./vite.config.ts"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  },
  core: { disableTelemetry: true },
  async viteFinal(cfg) {
    cfg.plugins = cfg.plugins ?? [];

    // Even with `viteConfigPath` pointing at our stub, one TanStack Start
    // plugin (`tanstack-start:start-manifest-capture-client-build`) still
    // attaches to the build pipeline and trips on Storybook's mocker entry.
    // Strip it at configResolved time.
    cfg.plugins.push({
      name: "storybook:strip-tanstack-start-manifest-capture",
      configResolved(resolved) {
        const stripPluginName = "tanstack-start:start-manifest-capture-client-build";
        const matches = (p: unknown) => (p as { name?: string })?.name === stripPluginName;
        if (Array.isArray(resolved.plugins)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (resolved as any).plugins = resolved.plugins.filter((p) => !matches(p));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rollupPlugins = (resolved as any)?.build?.rollupOptions?.plugins;
        if (Array.isArray(rollupPlugins)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (resolved as any).build.rollupOptions.plugins = rollupPlugins.filter(
            (p: unknown) => !matches(p),
          );
        }
      },
    });

    cfg.plugins.push(tsconfigPaths(), tailwindcss());

    // Swap the real Supabase client for an in-memory fake so stories never
    // need VITE_SUPABASE_URL and never touch the network. The fake lives in
    // .storybook/supabase-mock.ts so it's obviously a test artifact.
    // Vite's alias accepts both record and array forms; normalize to array so
    // we don't accidentally clobber whatever tsconfigPaths wrote.
    cfg.resolve = cfg.resolve ?? {};
    const existing = cfg.resolve.alias;
    const asArray = Array.isArray(existing)
      ? existing
      : existing
        ? Object.entries(existing).map(([find, replacement]) => ({
            find,
            replacement: replacement as string,
          }))
        : [];
    cfg.resolve.alias = [
      {
        find: "@/integrations/supabase/client",
        replacement: path.resolve(__dirname, "./supabase-mock.ts"),
      },
      ...asArray,
    ];
    return cfg;
  },
};

export default config;
