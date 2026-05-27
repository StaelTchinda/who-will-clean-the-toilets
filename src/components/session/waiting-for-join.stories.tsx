import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitingForJoin } from "./waiting-for-join";
import { makeSession } from "@/test/fixtures";

const meta = {
  title: "Views/Session/WaitingForJoin",
  component: WaitingForJoin,
  args: {
    code: "ABCD",
    partner: "a",
    session: makeSession({ partner_b_name: null }),
  },
} satisfies Meta<typeof WaitingForJoin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
