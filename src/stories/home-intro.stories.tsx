import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Intro } from "@/routes/index";

// Only the presentational Intro is storied. CreateForm/JoinForm call Supabase on
// submit and are intentionally out of scope.
const meta = {
  title: "Pages/Home/Intro",
  component: Intro,
  args: { onChoose: fn() },
} satisfies Meta<typeof Intro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
