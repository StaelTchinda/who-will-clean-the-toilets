import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
    return cfg;
  },
};

export default config;
