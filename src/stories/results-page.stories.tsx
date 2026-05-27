import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResultsView } from "@/components/ui/results-view";
import { empty, fullAgreement, highDivergence, partialDivergence } from "@/test/fixtures";

// Stage story for the final screen: both partners have completed, the route
// renders `<ResultsView ... />` directly (no extra shell). This story mirrors
// that under `Pages/...` so the whole user journey is browsable in one place.
// The component-only stories live at `components/ui/results-view.stories.tsx`.
const meta = {
  title: "Pages/Session/Results",
  component: ResultsView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ResultsView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stage 4a — both partners agree everywhere. All rows converge. */
export const FullAgreement: Story = { args: fullAgreement };

/**
 * Stage 4b — realistic middle case: half the rows converge, half diverge.
 * Exercises both highlight sections of ResultsView at once, which is the
 * shape most real sessions land in.
 */
export const PartialDivergence: Story = { args: partialDivergence };

/** Stage 4c — opposing picks throughout. All rows diverge. */
export const HighDivergence: Story = { args: highDivergence };

/** Stage 4d — no answers at all (defensive empty state). */
export const Empty: Story = { args: empty };
