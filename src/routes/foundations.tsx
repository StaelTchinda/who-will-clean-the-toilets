import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE } from "@/i18n";

// Redirect bare /foundations to the default locale version
export const Route = createFileRoute("/foundations")({
  loader: () => {
    throw redirect({
      to: "/$locale/foundations",
      params: { locale: DEFAULT_LOCALE },
      replace: true,
    });
  },
  component: () => null,
});
