import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitingForFinish } from "./waiting-for-finish";
import { makeSession } from "@/test/fixtures";

const meta = {
  title: "Views/Session/WaitingForFinish",
  component: WaitingForFinish,
  args: {
    session: makeSession(),
    partner: "a",
    totalQuestions: 53,
  },
} satisfies Meta<typeof WaitingForFinish>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OtherAtZero: Story = {};

export const OtherMidway: Story = {
  args: {
    otherProgress: {
      session_id: "sess-1",
      partner: "b",
      current_index: 27,
      total: 53,
      completed: false,
    },
  },
};
