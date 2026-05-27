import type { Preview } from "@storybook/react-vite";
import "../src/styles.css"; // Tailwind 4 theme vars + utilities so stories match the app
import { RouterDecorator } from "./router-decorator";
import { LocaleDecorator } from "./i18n-decorator";

// Globe toolbar — visible in the Storybook top bar alongside viewport/backgrounds.
// The toolbar is built into Storybook v10 core; no extra addon is needed.
// Using plain export (non-CSF4 path) so globalTypes flows through composeConfigs
// directly, which is the well-tested path for toolbar global type registration.
const preview: Preview = {
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      toolbar: {
        icon: "globe",
        items: [
          { value: "fr", right: "🇫🇷", title: "Français" },
          { value: "en", right: "🇬🇧", title: "English" },
          { value: "de", right: "🇩🇪", title: "Deutsch" },
        ],
        dynamicTitle: true,
      },
    },
  },

  // Default locale shown when no selection has been made yet.
  // initialGlobals (not defaultValue inside globalTypes) is the Storybook v8+ API.
  initialGlobals: {
    locale: "fr",
  },

  parameters: {
    layout: "fullscreen", // views are full-page (min-h-[100dvh])
    controls: { expanded: true },
  },

  // Decorator order: Storybook applies last-to-first (innermost first).
  // RouterDecorator (last) wraps the story in RouterProvider.
  // LocaleDecorator (first) wraps everything in I18nextProvider.
  decorators: [LocaleDecorator, RouterDecorator],
};

export default preview;
