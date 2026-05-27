import type { Preview } from "@storybook/react-vite";
import "../src/styles.css"; // Tailwind 4 theme vars + utilities so stories match the app
import { RouterDecorator } from "./router-decorator";
import { LocaleDecorator } from "./i18n-decorator";

const preview: Preview = {
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      defaultValue: "fr",
      toolbar: {
        icon: "globe",
        items: [
          { value: "fr", right: "🇫🇷", title: "Français" },
          { value: "en", right: "🇬🇧", title: "English" },
          { value: "de", right: "🇩🇪", title: "Deutsch" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
  },
  // Decorator order: outermost → innermost (Storybook applies last-to-first).
  // LocaleDecorator (outermost) provides I18nextProvider.
  // RouterDecorator (innermost) provides RouterProvider for useNavigate / Link.
  decorators: [LocaleDecorator, RouterDecorator],
};

export default preview;
