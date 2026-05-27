import type { Preview } from "@storybook/react-vite";
import "../src/styles.css"; // Tailwind 4 theme vars + utilities so stories match the app
import { RouterDecorator } from "./router-decorator";

const preview: Preview = {
  parameters: {
    layout: "fullscreen", // views are full-page (min-h-[100dvh])
    controls: { expanded: true },
  },
  decorators: [RouterDecorator],
};

export default preview;
