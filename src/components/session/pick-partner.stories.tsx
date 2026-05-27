import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { PickPartner } from "./pick-partner";
import { makeSession } from "@/test/fixtures";

const meta = {
  title: "Views/Session/PickPartner",
  component: PickPartner,
  args: { code: "ABCD", onPicked: fn() },
} satisfies Meta<typeof PickPartner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Only partner A named yet → a single button.
export const PartnerBOnly: Story = {
  args: { session: makeSession({ partner_b_name: null }) },
};

// Both partners named → two buttons.
export const BothNamed: Story = {
  args: { session: makeSession() },
};
