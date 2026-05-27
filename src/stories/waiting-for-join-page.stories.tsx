import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitingForJoin } from "@/components/session/waiting-for-join";
import { makeSession } from "@/test/fixtures";

// Stage story for /s/$code right after creation: partner A has set their name
// but partner B hasn't joined yet — the screen showing the big shareable code
// and "en attente…" pulse. WaitingForJoin already includes its own page
// wrapper (full-height centered layout), so no extra shell is needed. A
// component-level twin lives at components/session/waiting-for-join.stories.tsx
// for isolated visual testing; this file surfaces the same screen as a journey
// stage under `Pages/...`.
const meta = {
  title: "Pages/Session/WaitingForJoin",
  component: WaitingForJoin,
  parameters: { layout: "fullscreen" },
  args: {
    code: "ABCD",
    partner: "a" as const,
    session: makeSession({ partner_b_name: null }),
  },
} satisfies Meta<typeof WaitingForJoin>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Stage — creator has just submitted the create form and is waiting for the
 * partner to enter the code on their own device.
 */
export const Default: Story = {};
