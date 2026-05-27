import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SwipeCard } from "./swipe-card";

const answers = [
  { id: "sanitizing", label: "Nettoyer les sanitaires" },
  { id: "floors", label: "Laver les sols" },
  { id: "both_fine", label: "Je maîtrise les deux" },
  { id: "neither_fine", label: "Ni l'un ni l'autre vraiment" },
];

const meta = {
  title: "Views/SwipeCard",
  component: SwipeCard,
  args: {
    questionLabel:
      "Entre nettoyer les sanitaires et laver les sols, lequel maîtrises-tu le mieux ?",
    meta: "Ménage · Talent",
    domainId: "housekeeping",
    answers,
    onPick: fn(),
  },
} satisfies Meta<typeof SwipeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unanswered: Story = {};
export const AlreadyAnswered: Story = { args: { current: "sanitizing" } };
