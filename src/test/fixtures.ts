// Shared mock data for BOTH Vitest tests and Storybook stories — single source
// of truth so the two never drift. Imports only types + pure helpers (no React,
// no Supabase access), so it is safe in the node test env and the browser SB env.
import type { Question, AngleId, DomainId } from "@/lib/dataset";
import { buildQuestionList } from "@/lib/dataset";
import type { AnswerRow, ChildrenAnswer, SessionRow } from "@/lib/session";
import type { Locale } from "@/i18n";

// ── Builders ────────────────────────────────────────────────────────────────

let qSeq = 0;

/** A minimal Question with sane defaults; override any field via `partial`. */
export function makeQuestion(partial: Partial<Question> = {}): Question {
  qSeq += 1;
  return {
    id: partial.id ?? `q_${qSeq}`,
    label: partial.label ?? `Question ${qSeq} ?`,
    domain_id: partial.domain_id ?? ("housekeeping" as DomainId),
    task_ids: partial.task_ids ?? [],
    angle_id: partial.angle_id ?? ("value" as AngleId),
    priority: partial.priority ?? "important",
    answers: partial.answers ?? [
      { id: "opt_a", label: "Option A" },
      { id: "opt_b", label: "Option B" },
      { id: "both_fine", label: "Both fine" },
      { id: "neither_fine", label: "Neither" },
    ],
  };
}

/** One partner's answer to one question. */
export function answer(
  partner: "a" | "b",
  questionId: string,
  answerId: string,
  sessionId = "sess-1",
): AnswerRow {
  return { session_id: sessionId, partner, question_id: questionId, answer_id: answerId };
}

/** A SessionRow with both partners named and children, override via `partial`. */
export function makeSession(partial: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "sess-1",
    code: "ABCD",
    partner_a_name: "Camille",
    partner_b_name: "Alex",
    has_children_a: "yes" as ChildrenAnswer,
    has_children_b: "yes" as ChildrenAnswer,
    started_at: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

// ── Named scenarios (reused by ResultsView stories AND integration tests) ─────

export interface Scenario {
  session: SessionRow;
  questions: Question[];
  answers: AnswerRow[];
  includeChildren: boolean;
  locale: Locale;
}

// Real dataset questions span four domains so ResultsView can show a meaningful
// analysis tab (domain-level convergence bars), a filled table tab, and task
// suggestions. Using real IDs means tData("questions.{id}.label") finds actual
// translations in data.json — no French fallbacks.
const ALL_Q = buildQuestionList(true);
const pick = (id: string): Question => {
  const q = ALL_Q.find((q) => q.id === id);
  if (!q) throw new Error(`Fixture: question "${id}" not found in dataset`);
  return q;
};

const SCENARIO_QUESTIONS: Question[] = [
  pick("q_housekeeping_val_cleanliness"), // housekeeping / value
  pick("q_cooking_talent_daily"),          // cooking / talent
  pick("q_finances_talent_budget"),        // finances / talent
  pick("q_children_env_daily"),            // children / environment
];

const session = makeSession();

/** Both partners answer identically everywhere → all converge. */
export const fullAgreement: Scenario = {
  session,
  questions: SCENARIO_QUESTIONS,
  includeChildren: true,
  locale: "fr",
  answers: SCENARIO_QUESTIONS.flatMap((q) => [
    answer("a", q.id, q.answers[0].id),
    answer("b", q.id, q.answers[0].id),
  ]),
};

/** Partners pick opposite concrete answers everywhere → all diverge. */
export const highDivergence: Scenario = {
  session,
  questions: SCENARIO_QUESTIONS,
  includeChildren: true,
  locale: "fr",
  answers: SCENARIO_QUESTIONS.flatMap((q) => [
    answer("a", q.id, q.answers[0].id),
    answer("b", q.id, q.answers[1].id),
  ]),
};

/** No answers at all → every row neutral, empty highlights. */
export const empty: Scenario = {
  session,
  questions: SCENARIO_QUESTIONS,
  includeChildren: true,
  locale: "fr",
  answers: [],
};

/**
 * Realistic middle case — partners agree on some questions, disagree on
 * others. With four SCENARIO_QUESTIONS, the first two converge (both pick
 * answer[0]) and the last two diverge (a picks answer[0], b picks answer[1]),
 * giving the ResultsView something to show in both the converge and diverge
 * highlights.
 */
export const partialDivergence: Scenario = {
  session,
  questions: SCENARIO_QUESTIONS,
  includeChildren: true,
  locale: "fr",
  answers: SCENARIO_QUESTIONS.flatMap((q, i) => {
    const converge = i < 2;
    return [
      answer("a", q.id, q.answers[0].id),
      answer("b", q.id, q.answers[converge ? 0 : 1].id),
    ];
  }),
};

// ── Questionnaire stage fixtures ────────────────────────────────────────────
// Ten real dataset questions spanning all six domains. Using real IDs means
// tData() can translate question labels, answer labels, domain names, and
// angle names — locale toolbar changes propagate through everything.

export const QUESTIONNAIRE_QUESTIONS: Question[] = [
  pick("q_housekeeping_env_general"),           // housekeeping / environment
  pick("q_housekeeping_val_cleanliness"),        // housekeeping / value
  pick("q_cooking_env_general"),                 // cooking / environment
  pick("q_cooking_talent_daily"),                // cooking / talent
  pick("q_finances_env_general"),                // finances / environment
  pick("q_finances_talent_budget"),              // finances / talent
  pick("q_logistics_talent_diy_vs_contractors"), // logistics / talent
  pick("q_logistics_pref_diy_vs_contractors"),   // logistics / preference
  pick("q_children_env_daily"),                  // children / environment
  pick("q_values_val_fairness"),                 // values / value
];

/**
 * Builds AnswerRow[] for the first `upToIndex` questions of QUESTIONNAIRE_QUESTIONS
 * (each gets the first answer option). Because Questionnaire derives its initial
 * index from which questions are already answered, a story that wants to land
 * on question N just passes `questionnaireMidAnswers("a", N)`.
 */
export function questionnaireMidAnswers(partner: "a" | "b", upToIndex: number): AnswerRow[] {
  return QUESTIONNAIRE_QUESTIONS.slice(0, upToIndex).map((q) =>
    answer(partner, q.id, q.answers[0].id),
  );
}
