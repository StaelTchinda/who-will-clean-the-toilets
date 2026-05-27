import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitingForFinish } from "@/components/session/waiting-for-finish";
import { makeSession } from "@/test/fixtures";
import type { ProgressRow } from "@/lib/session";

// Stage story for /s/$code when the current partner has finished but the
// other hasn't: a centered "On attend que {name} finisse" page with the
// other's progress bar. WaitingForFinish includes its own page wrapper, so no
// extra shell is needed here. A component-level twin lives at
// components/session/waiting-for-finish.stories.tsx; this file surfaces the
// same screen as a journey stage under `Pages/...`, with four variants that
// span the progress bar's range.
const TOTAL = 53;

// Helper so each variant is just a number, not a hand-built ProgressRow.
const progress = (currentIndex: number): ProgressRow => ({
  session_id: "sess-1",
  partner: "b",
  current_index: currentIndex,
  total: TOTAL,
  completed: false,
});

const meta = {
  title: "Pages/Session/WaitingForFinish",
  component: WaitingForFinish,
  parameters: { layout: "fullscreen" },
  args: {
    session: makeSession(),
    partner: "a" as const,
    totalQuestions: TOTAL,
  },
} satisfies Meta<typeof WaitingForFinish>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Other partner hasn't touched the questionnaire yet — bar at 0 %. */
export const OtherAtZero: Story = {
  args: { otherProgress: undefined },
};

/** Other partner just started — bar near 10 %. */
export const OtherJustStarted: Story = {
  args: { otherProgress: progress(5) },
};

/** Other partner about half-way — bar near 50 %. */
export const OtherMidway: Story = {
  args: { otherProgress: progress(27) },
};

/** Other partner is nearly done — bar near 95 %. */
export const OtherNearDone: Story = {
  args: { otherProgress: progress(50) },
};
