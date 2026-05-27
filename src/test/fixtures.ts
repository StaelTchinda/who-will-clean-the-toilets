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
