import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Storybook runs its OWN Vite — it deliberately does NOT load the project's
// vite.config.ts (which uses @lovable.dev/vite-tanstack-config: tanstackStart +
// cloudflare + SSR entry, none of which belong in Storybook). Via viteFinal we
// add only the two things the components need: the @/* alias and Tailwind 4.
// Do NOT add @vitejs/plugin-react here — the react-vite framework provides React.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  // SB10 bundles docs/controls/actions into core — no addons needed for the
  // crash-smoke + interactive-playground goals here.
  addons: [],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  async viteFinal(cfg) {
    cfg.plugins = cfg.plugins ?? [];
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
