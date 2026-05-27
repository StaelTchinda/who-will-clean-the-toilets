import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n";

/**
 * Resolves the active locale from the leading URL segment, falling back to the
 * live i18n language. Centralises the path ?? i18n ?? default chain that several
 * components otherwise repeat.
 *
 * In the real app the URL always starts with a locale segment (/fr/…, /en/…) so
 * the path wins. In Storybook the minimal router path is "/", so we fall back to
 * the live language. useTranslation() subscribes the caller to language changes,
 * so the fallback branch re-renders when the Storybook locale toolbar (or the
 * route loader) calls i18n.changeLanguage().
 *
 * We read resolvedLanguage — the language actually in use after i18next's
 * fallback resolution — rather than language, which can hold a regional variant
 * with no matching resources.
 */
export function useLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { i18n } = useTranslation();

  const pathLocale = pathname.match(/^\/([^/]+)/)?.[1] as Locale | undefined;
  if (pathLocale && LOCALES.includes(pathLocale)) {
    return pathLocale;
  }

  const resolved = i18n.resolvedLanguage as Locale | undefined;
  return resolved && LOCALES.includes(resolved) ? resolved : DEFAULT_LOCALE;
}
