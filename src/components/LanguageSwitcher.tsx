import { useRouterState, useRouter } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALE_FLAG: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  de: "🇩🇪",
};

const LOCALE_LABEL: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
};

/**
 * Dropdown language switcher with flags.
 * Replaces only the locale segment in the current URL so the user stays
 * on the same page. Uses client-side navigation via the router history.
 */
export function LanguageSwitcher() {
  const routerState = useRouterState();
  const router = useRouter();
  const currentPath = routerState.location.pathname;

  // Extract the locale segment: matches /<locale> or /<locale>/<rest>
  const localeMatch = currentPath.match(/^\/([^/]+)(\/.*)?$/);
  const currentLocale = (localeMatch?.[1] as Locale) ?? DEFAULT_LOCALE;

  const handleSelect = (locale: Locale) => {
    if (locale === currentLocale) return;
    const newPath = currentPath.replace(`/${currentLocale}`, `/${locale}`);
    // Preserve any query string / hash while staying on the same page
    // searchStr already includes the leading "?"; hash excludes the "#"
    const searchStr = routerState.location.searchStr ?? "";
    const hash = routerState.location.hash ? `#${routerState.location.hash}` : "";
    router.history.push(newPath + searchStr + hash);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Change language"
        >
          <span>{LOCALE_FLAG[currentLocale]}</span>
          <span className="uppercase tracking-wider">{currentLocale}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => handleSelect(locale)}
            className={locale === currentLocale ? "bg-accent" : ""}
          >
            <span className="mr-2 text-base">{LOCALE_FLAG[locale]}</span>
            <span className="flex-1">{LOCALE_LABEL[locale]}</span>
            {locale === currentLocale && (
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
