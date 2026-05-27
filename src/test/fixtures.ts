// Shared mock data for BOTH Vitest tests and Storybook stories — single source
// of truth so the two never drift. Imports only types + pure helpers (no React,
// no Supabase access), so it is safe in the node test env and the browser SB env.
import type { Answer, Question, AngleId, DomainId } from "@/lib/dataset";
import type { AnswerRow, ChildrenAnswer, SessionRow } from "@/lib/session";

// ── Builders ────────────────────────────────────────────────────────────────

let qSeq = 0;

/** A minimal Question with sane defaults; override any field via `partial`. */
export function makeQuestion(partial: Partial<Question> = {}): Question {
  qSeq += 1;
  const answers: Answer[] = partial.answers ?? [
    { id: "opt_a", label: "Option A" },
    { id: "opt_b", label: "Option B" },
    { id: "both_fine", label: "Les deux me vont" },
    { id: "neither_fine", label: "Ni l'un ni l'autre" },
  ];
  return {
    id: partial.id ?? `q_${qSeq}`,
    label: partial.label ?? `Question ${qSeq} ?`,
    domain_id: partial.domain_id ?? "housekeeping",
    task_ids: partial.task_ids ?? [],
    angle_id: partial.angle_id ?? ("value" as AngleId),
    priority: partial.priority ?? "important",
    answers,
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
}

// A handful of questions spanning a few domains/angles, used to drive the
// presentational scenarios below. `domainId` lets stories cover several rows.
const SCENARIO_QUESTIONS: Question[] = [
  makeQuestion({
    id: "sc_clean",
    label: "Qui nettoie le plus volontiers ?",
    domain_id: "housekeeping" as DomainId,
    angle_id: "preference" as AngleId,
    task_ids: ["general_cleaning"],
    answers: [
      { id: "me", label: "Moi" },
      { id: "partner", label: "Mon/ma partenaire" },
      { id: "both_fine", label: "Les deux, ça va" },
      { id: "neither_fine", label: "Aucun·e des deux" },
    ],
  }),
  makeQuestion({
    id: "sc_cook",
    label: "Cuisiner au quotidien, c'est…",
    domain_id: "cooking" as DomainId,
    angle_id: "talent" as AngleId,
    task_ids: ["cooking_daily"],
    answers: [
      { id: "easy", label: "Facile pour moi" },
      { id: "hard", label: "Difficile" },
      { id: "both_fine", label: "Les deux, ça va" },
      { id: "neither_fine", label: "Aucun·e des deux" },
    ],
  }),
  makeQuestion({
    id: "sc_money",
    label: "Gérer le budget commun ?",
    domain_id: "finances" as DomainId,
    angle_id: "value" as AngleId,
    answers: [
      { id: "shared", label: "Ensemble" },
      { id: "one_person", label: "Une seule personne" },
      { id: "both_fine", label: "Peu importe" },
      { id: "neither_fine", label: "À éviter" },
    ],
  }),
  makeQuestion({
    id: "sc_kids",
    label: "Coucher les enfants le soir ?",
    domain_id: "children" as DomainId,
    angle_id: "preference" as AngleId,
    answers: [
      { id: "me", label: "Moi" },
      { id: "partner", label: "Mon/ma partenaire" },
      { id: "both_fine", label: "Les deux, ça va" },
      { id: "neither_fine", label: "Aucun·e des deux" },
    ],
  }),
];

const session = makeSession();

/** Both partners answer identically everywhere → all converge. */
export const fullAgreement: Scenario = {
  session,
  questions: SCENARIO_QUESTIONS,
  includeChildren: true,
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
  answers: SCENARIO_QUESTIONS.flatMap((q, i) => {
    const converge = i < 2;
    return [answer("a", q.id, q.answers[0].id), answer("b", q.id, q.answers[converge ? 0 : 1].id)];
  }),
};

/** includeChildren on — the children question/tasks are present. */
export const withChildren: Scenario = {
  ...fullAgreement,
  includeChildren: true,
};

/** includeChildren off — children domain excluded from suggestions. */
export const withoutChildren: Scenario = {
  session: makeSession({ has_children_a: "no", has_children_b: "no" }),
  questions: SCENARIO_QUESTIONS.filter((q) => q.domain_id !== "children"),
  includeChildren: false,
  answers: fullAgreement.answers.filter((a) => a.question_id !== "sc_kids"),
};

// ── Questionnaire stage fixtures ────────────────────────────────────────────
// A larger, ordered question list for the questionnaire stories so Start,
// MidFlow, and NearEnd land on visibly different states (progress bar,
// counter, meta line). Distinct from SCENARIO_QUESTIONS (which is tiny on
// purpose for ResultsView aggregation tests).

const STANDARD_ANSWERS: Answer[] = [
  { id: "me", label: "Moi" },
  { id: "partner", label: "Mon/ma partenaire" },
  { id: "both_fine", label: "Les deux me vont" },
  { id: "neither_fine", label: "Aucun·e des deux" },
];

export const QUESTIONNAIRE_QUESTIONS: Question[] = [
  makeQuestion({
    id: "qf_1",
    label: "Qui fait le ménage hebdomadaire ?",
    domain_id: "housekeeping" as DomainId,
    angle_id: "preference" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_2",
    label: "Les sanitaires, c'est l'affaire de qui ?",
    domain_id: "housekeeping" as DomainId,
    angle_id: "value" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_3",
    label: "Qui cuisine en semaine ?",
    domain_id: "cooking" as DomainId,
    angle_id: "talent" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_4",
    label: "Planifier les menus de la semaine ?",
    domain_id: "cooking" as DomainId,
    angle_id: "preference" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_5",
    label: "Qui suit les comptes du foyer ?",
    domain_id: "finances" as DomainId,
    angle_id: "talent" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_6",
    label: "Les rendez-vous administratifs, c'est qui ?",
    domain_id: "logistics" as DomainId,
    angle_id: "preference" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_7",
    label: "Organiser un déménagement ou un voyage ?",
    domain_id: "logistics" as DomainId,
    angle_id: "talent" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_8",
    label: "Le coucher des enfants ?",
    domain_id: "children" as DomainId,
    angle_id: "preference" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_9",
    label: "Choisir la crèche ou l'école ?",
    domain_id: "children" as DomainId,
    angle_id: "value" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
  makeQuestion({
    id: "qf_10",
    label: "Décider des grandes lignes de vie commune ?",
    domain_id: "values" as DomainId,
    angle_id: "value" as AngleId,
    answers: STANDARD_ANSWERS,
  }),
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
