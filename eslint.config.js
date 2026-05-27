import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      "storybook-static",
      "coverage",
      "coverage-e2e",
      "coverage-merged",
      ".nyc_output",
      "test-results",
      "playwright-report",
      ".claude",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Playwright fixtures use a `use(value)` callback that is not a React Hook,
    // but the react-hooks plugin's regex matches the name. Disable the rule
    // for e2e files so legitimate Playwright fixtures don't trip it.
    files: ["tests/e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    // shadcn/ui components follow the upstream pattern of co-locating
    // `cva` variants, contexts, and small hooks with their components.
    // Fast-refresh only cares about HMR ergonomics, and we don't ship the
    // components in isolation, so the warning is noise here.
    files: ["src/components/ui/**/*.{ts,tsx}", "src/hooks/use-mobile.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  eslintPluginPrettier,
);
