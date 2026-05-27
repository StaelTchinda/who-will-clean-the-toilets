import { createFileRoute, redirect } from "@tanstack/react-router";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n";

// Detect preferred locale from Accept-Language header (server-side)
// Falls back to DEFAULT_LOCALE when the header is absent or no match found.
function detectLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const preferred = acceptLanguage
    .split(",")
    .map((s) => s.split(";")[0].trim().slice(0, 2).toLowerCase());
  return (preferred.find((l) => LOCALES.includes(l as Locale)) as Locale) ?? DEFAULT_LOCALE;
}

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    // context.request is available in TanStack Start server-side loaders
    const acceptLanguage =
      typeof context === "object" && context !== null && "request" in context
        ? (context as { request?: Request }).request?.headers.get("accept-language")
        : null;
    const locale = detectLocale(acceptLanguage);
    throw redirect({ to: "/$locale", params: { locale }, replace: true });
  },
  component: () => null,
});

// Re-export the i18n-aware shell and stage components so stories can import
// from this module and automatically pick up translations + LanguageSwitcher.
export type { Mode } from "./$locale/index";
export { HomeShell, Intro, CreateForm, JoinForm } from "./$locale/index";
