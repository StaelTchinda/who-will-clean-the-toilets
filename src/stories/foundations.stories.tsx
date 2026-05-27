import type { Meta, StoryObj } from "@storybook/react-vite";
import { FoundationsPage } from "@/routes/foundations";

const meta = {
  title: "Pages/Foundations",
  component: FoundationsPage,
} satisfies Meta<typeof FoundationsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
