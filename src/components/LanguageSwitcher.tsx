import { useRouterState, useParams } from "@tanstack/react-router";
import { LOCALES, type Locale } from "@/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  de: "DE",
};

/**
 * A compact FR / EN / DE switcher.
 * Replaces only the locale segment in the current URL, preserving all other path segments.
 * Must be rendered inside a /$locale route (or deeper) so the locale param is available.
 */
export function LanguageSwitcher() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Try to read the current locale from the URL.
  // Matches /<locale> or /<locale>/<rest>
  const localeMatch = currentPath.match(/^\/([^/]+)(\/.*)?$/);
  const currentLocale = (localeMatch?.[1] as Locale) || "fr";

  return (
    <nav aria-label="Language selection" className="flex gap-1 text-[10px]">
      {LOCALES.map((locale) => {
        const href = currentPath.replace(`/${currentLocale}`, `/${locale}`);
        const isActive = locale === currentLocale;
        return (
          <a
            key={locale}
            href={href}
            aria-current={isActive ? "true" : undefined}
            className={`rounded px-2 py-1 uppercase tracking-wider transition ${
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {LOCALE_LABELS[locale]}
          </a>
        );
      })}
    </nav>
  );
}
