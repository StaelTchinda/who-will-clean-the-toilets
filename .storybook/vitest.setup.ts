// Vitest setup for the `storybook` project. Empty by design — since
// Storybook 10.3 the addon-vitest plugin reads .storybook/preview.tsx and
// applies its project annotations automatically (RouterDecorator, fullscreen
// layout, the Tailwind stylesheet). Kept as a file so it can be a hook for
// future per-test setup without touching vitest.config.ts.
export {};
