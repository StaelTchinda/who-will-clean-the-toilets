import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE } from "@/i18n";

// Redirect bare /s/:code to the default locale version
export const Route = createFileRoute("/s/$code")({
  loader: ({ params }) => {
    throw redirect({
      to: "/$locale/s/$code",
      params: { locale: DEFAULT_LOCALE, code: params.code },
      replace: true,
    });
  },
  component: () => null,
});

// Re-export the i18n-aware Questionnaire so stories can import from this
// module and automatically pick up translations.
export { Questionnaire } from "./$locale/s.$code";
