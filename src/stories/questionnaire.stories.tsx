import type { Meta, StoryObj } from "@storybook/react-vite";
import { Questionnaire } from "@/routes/$locale/s.$code";
import {
  QUESTIONNAIRE_QUESTIONS,
  answer,
  makeSession,
  questionnaireMidAnswers,
} from "@/test/fixtures";

// Stage-level stories for the questionnaire. Each variant pins the user to a
// specific point in the flow so the progress bar, counter, and meta line are
// visibly different.
//
// `Questionnaire` writes to Supabase on every pick (`upsertAnswer`,
// `upsertProgress`, `markStarted`). Storybook aliases the supabase client to a
// no-op fake, so a story can be interactive without touching the network.
//
// `initialIndex` inside Questionnaire is derived from the first unanswered
// question — that's why we seed `answers` with the first N options via
// `questionnaireMidAnswers` rather than passing an index prop.
const meta = {
  title: "Pages/Session/Questionnaire",
  component: Questionnaire,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    session: makeSession(),
    partner: "a" as const,
    questions: QUESTIONNAIRE_QUESTIONS,
  },
} satisfies Meta<typeof Questionnaire>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stage 3a — fresh open. Lands on question 1, progress ≈ 0 %. */
export const Start: Story = {
  args: { answers: [] },
};

/** Stage 3b — half-way through. Lands on question 6 with no current pick. */
export const MidFlow: Story = {
  args: { answers: questionnaireMidAnswers("a", 5) },
};

/**
 * Stage 3c — same mid-flow position, but the visible question already has a
 * selection (user came back via the ← arrow). Highlights the SwipeCard's
 * "selected" state. Uses answers[1] so it differs visually from questionnaireMidAnswers
 * which always picks answers[0].
 */
export const MidFlowWithCurrent: Story = {
  args: {
    answers: [
      ...questionnaireMidAnswers("a", 5),
      answer("a", QUESTIONNAIRE_QUESTIONS[5].id, QUESTIONNAIRE_QUESTIONS[5].answers[1].id),
    ],
  },
};

/** Stage 3d — last question, progress ≈ 100 %. */
export const NearEnd: Story = {
  args: { answers: questionnaireMidAnswers("a", 9) },
};
