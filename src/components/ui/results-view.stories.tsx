import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResultsView } from "./results-view";
import {
  empty,
  fullAgreement,
  highDivergence,
  withChildren,
  withoutChildren,
} from "@/test/fixtures";

const meta = {
  title: "Views/ResultsView",
  component: ResultsView,
} satisfies Meta<typeof ResultsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullAgreement: Story = { args: fullAgreement };
export const HighDivergence: Story = { args: highDivergence };
export const Empty: Story = { args: empty };
export const WithChildren: Story = { args: withChildren };
export const WithoutChildren: Story = { args: withoutChildren };
