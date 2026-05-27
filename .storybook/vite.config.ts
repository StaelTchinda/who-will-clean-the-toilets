import { defineConfig } from "vite";

// Empty stub config used by Storybook (via framework.options.viteConfigPath).
// Storybook's @storybook/react-vite auto-merges the project root's
// vite.config.ts by default, which in this repo pulls in
// @lovable.dev/vite-tanstack-config (tanstackStart, cloudflare, SSR entry).
// Those plugins assume a single client entry and break Storybook's preview
// build, which adds its own mocker entry. Pointing Storybook at this empty
// stub avoids the merge entirely. All Storybook-specific Vite tweaks
// (tailwind, supabase alias, etc.) live in `.storybook/main.ts viteFinal`.
export default defineConfig({});
