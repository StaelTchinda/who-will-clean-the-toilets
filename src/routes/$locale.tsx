import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!LOCALES.includes(params.locale as Locale)) {
      throw redirect({
        to: "/$locale",
        params: { locale: DEFAULT_LOCALE },
        replace: true,
      });
    }
    // Set language synchronously before render (works for SSR)
    i18n.changeLanguage(params.locale);
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();

  // Keep i18n in sync on client-side navigation
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <I18nextProvider i18n={i18n}>
      <Outlet />
    </I18nextProvider>
  );
}
