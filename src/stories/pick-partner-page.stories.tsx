import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { PickPartner } from "@/components/session/pick-partner";
import { makeSession } from "@/test/fixtures";

// Stage story for /s/$code when the device has no partner role yet (no
// `nosroles:partner:CODE` in localStorage). PickPartner already includes its
// own `Centered` page wrapper, so no extra shell is needed here — the story
// renders the stage exactly as the route does.
//
// A component-level twin lives at `components/session/pick-partner.stories.tsx`
// for isolated visual testing; this file represents the same screen as a
// journey stage under `Pages/...`.
const meta = {
  title: "Pages/Session/PickPartner",
  component: PickPartner,
  parameters: {
    layout: "fullscreen",
  },
  args: { code: "ABCD", onPicked: fn() },
} satisfies Meta<typeof PickPartner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Partner B hasn't joined yet — the picker shows only Partner A's button. */
export const PartnerBOnly: Story = {
  args: { session: makeSession({ partner_b_name: null }) },
};

/** Both partners have named themselves — picker shows both buttons. */
export const BothNamed: Story = {
  args: { session: makeSession() },
};
