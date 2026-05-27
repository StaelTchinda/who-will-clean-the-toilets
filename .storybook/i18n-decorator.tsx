import type { Decorator } from "@storybook/react-vite";
import { I18nextProvider } from "react-i18next";
import i18n, { DEFAULT_LOCALE, type Locale } from "../src/i18n";

/**
 * Wraps every story in I18nextProvider and switches the i18n singleton to
 * whatever locale is selected in the Storybook toolbar (global "locale").
 * Calling changeLanguage synchronously (before render) avoids the flash of
 * default-language content that a useEffect approach would cause.
 */
export const LocaleDecorator: Decorator = (Story, context) => {
  const locale = ((context.globals as Record<string, string>).locale as Locale) || DEFAULT_LOCALE;
  i18n.changeLanguage(locale);
  return (
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  );
};
