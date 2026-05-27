import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormStage, QuestionHeader, SwipeStage } from "@/components/ui/swipe-card";
import { QUESTIONS, ANGLE_BY_ID, DOMAIN_BY_ID, type DomainId } from "@/lib/dataset";

// Component-level stories for individual questions. The questionnaire flow
// stories (questionnaire.stories.tsx) cover stage transitions; this file is the
// review tool — pick any question by id, or render them all on one page.
//
// QuestionPreview mirrors the translation pipeline in
// src/routes/$locale/s.$code.tsx so what you see in the story is exactly
// what the route renders. The LocaleDecorator (.storybook/preview.tsx) swaps
// the i18n singleton when you change the 🇫🇷/🇬🇧/🇩🇪 toolbar.
//
// The route now exposes two answer surfaces (`SwipeStage` and `FormStage`)
// chosen via an inline ModeSelect. This story exposes the same `mode` arg so
// the reviewer can flip between them without leaving the question.

type Mode = "swipe" | "form";

interface QuestionPreviewProps {
  /** A question id from src/data/questions.json. */
  questionId: string;
  /** Which answer surface to render — matches the route's ModeSelect. */
  mode?: Mode;
  /**
   * "wrapped" reproduces the route chrome (mobile shell, progress bar, mode
   * picker, QuestionHeader). "bare" renders only the header + stage — used by
   * the grid story so 53 cards fit cleanly on one page.
   */
  frame?: "wrapped" | "bare";
}

function QuestionPreview({ questionId, mode = "swipe", frame = "wrapped" }: QuestionPreviewProps) {
  const { t: tData } = useTranslation("data");
  const q = QUESTIONS.find((qq) => qq.id === questionId);

  if (!q) {
    return (
      <div className="p-4 text-sm text-destructive">
        Unknown question id: <code>{questionId}</code>
      </div>
    );
  }

  const domain = DOMAIN_BY_ID[q.domain_id];
  const angle = ANGLE_BY_ID[q.angle_id];
  const domainLabel = tData(`domains.${q.domain_id}`, { defaultValue: domain.label });
  const angleLabel = tData(`angles.${q.angle_id}.label`, { defaultValue: angle.label });
  const questionLabel = tData(`questions.${q.id}.label`, { defaultValue: q.label });
  const translatedAnswers = q.answers.map((a) => ({
    ...a,
    label: tData(`questions.${q.id}.answers.${a.id}`, { defaultValue: a.label }),
  }));

  const header = (
    <QuestionHeader
      questionLabel={questionLabel}
      meta={`${domainLabel} · ${angleLabel}`}
      domainId={q.domain_id}
    />
  );

  const stage =
    mode === "swipe" ? (
      <SwipeStage domainId={q.domain_id} answers={translatedAnswers} onPick={() => {}} />
    ) : (
      <FormStage answers={translatedAnswers} onPick={() => {}} />
    );

  if (frame === "bare") {
    return (
      <div className="flex flex-col gap-2">
        {header}
        {stage}
      </div>
    );
  }

  // Faked progress chrome — the index/total reflect the question's position in
  // the raw QUESTIONS list (no priority/domain sort), which is good enough for
  // a visual preview and avoids importing buildQuestionList(includeChildren).
  const total = QUESTIONS.length;
  const index = QUESTIONS.findIndex((qq) => qq.id === q.id);
  const pct = ((index + 1) / total) * 100;

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-6 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex items-center gap-3 pb-6">
          <button
            type="button"
            disabled
            className="text-sm text-muted-foreground disabled:opacity-30"
          >
            ←
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {index + 1}/{total}
          </span>
        </div>
        <div className="mb-3 flex justify-end">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{mode}</span>
        </div>
        {header}
        <div className="flex flex-1 items-start pt-2">{stage}</div>
      </div>
    </main>
  );
}

const meta = {
  title: "Components/SwipeCard",
  component: QuestionPreview,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    questionId: {
      control: { type: "select" },
      options: QUESTIONS.map((q) => q.id),
      description: "Pick any question from src/data/questions.json",
    },
    mode: {
      control: { type: "inline-radio" },
      options: ["swipe", "form"] as Mode[],
      description: "Answer surface — matches the route's ModeSelect",
    },
    frame: {
      control: { type: "inline-radio" },
      options: ["wrapped", "bare"],
    },
  },
} satisfies Meta<typeof QuestionPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary review tool. Change `questionId` in the Storybook controls panel to
 * jump straight to any question — no need to click through the questionnaire
 * flow. The locale toolbar (🇫🇷/🇬🇧/🇩🇪) switches all labels live; the `mode`
 * radio switches between SwipeStage and FormStage.
 */
export const ByQuestionId: Story = {
  args: {
    questionId: QUESTIONS[0].id,
    mode: "swipe",
    frame: "wrapped",
  },
};

// Group questions by domain so a reviewer can scan one category at a time.
// Order follows DOMAIN_ORDER in dataset.ts via the order of DOMAIN_BY_ID keys.
const DOMAIN_IDS: DomainId[] = [
  "housekeeping",
  "cooking",
  "finances",
  "logistics",
  "children",
  "values",
];

function AllQuestionsGrid() {
  const { t: tData } = useTranslation("data");
  const [mode, setMode] = useState<Mode>("swipe");
  return (
    <main className="min-h-[100dvh] bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">All questions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {QUESTIONS.length} cards across {DOMAIN_IDS.length} domains. Use the locale toolbar to
              switch 🇫🇷 / 🇬🇧 / 🇩🇪.
            </p>
          </div>
          <div className="flex gap-1 rounded-full border border-border bg-card p-1 text-xs">
            {(["swipe", "form"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 transition ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </header>
        {DOMAIN_IDS.map((domainId) => {
          const questions = QUESTIONS.filter((q) => q.domain_id === domainId);
          if (questions.length === 0) return null;
          const domainLabel = tData(`domains.${domainId}`, {
            defaultValue: DOMAIN_BY_ID[domainId].label,
          });
          return (
            <section key={domainId}>
              <h2 className="mb-4 text-xs uppercase tracking-[0.22em] text-primary">
                {domainLabel} · {questions.length}
              </h2>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {q.id}
                    </div>
                    <QuestionPreview questionId={q.id} mode={mode} frame="bare" />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

/**
 * Every question on one page, grouped by domain. The fastest way to spot
 * inconsistencies in answer icons and label lengths across the whole set.
 * The mode toggle (swipe / form) at the top flips all 53 cards together so
 * you can compare both surfaces with the same labels and icons.
 */
export const AllQuestions: StoryObj = {
  render: () => <AllQuestionsGrid />,
};
