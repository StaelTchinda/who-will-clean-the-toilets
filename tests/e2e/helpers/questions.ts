// We don't import src/lib/dataset directly because that module uses bare
// `import x from "@/data/x.json"` (Vite handles JSON natively, Node doesn't
// without `with { type: "json" }`). Re-implementing the small sort+filter
// here keeps the test runtime in pure Node land while staying byte-for-byte
// faithful to buildQuestionList — the unit test in src/lib/analysis.test.ts
// would catch us if the logic drifted.

import questionsJson from "../../../src/data/questions.json" with { type: "json" };

type Priority = "essential" | "important" | "nice_to_have";
type AngleId = "environment" | "talent" | "preference" | "value";
type DomainId =
  | "housekeeping"
  | "cooking"
  | "finances"
  | "logistics"
  | "children"
  | "values";

export interface Answer {
  id: string;
  label: string;
}
export interface Question {
  id: string;
  label: string;
  domain_id: DomainId;
  task_ids: string[];
  angle_id: AngleId;
  priority: Priority;
  answers: Answer[];
}

const QUESTIONS = questionsJson as Question[];

const PRIORITY_ORDER: Record<Priority, number> = {
  essential: 0,
  important: 1,
  nice_to_have: 2,
};
const DOMAIN_ORDER: DomainId[] = [
  "housekeeping",
  "cooking",
  "finances",
  "logistics",
  "children",
  "values",
];

export function questionsFor(includeChildren: boolean): Question[] {
  return QUESTIONS.filter(
    (q) => includeChildren || q.domain_id !== "children",
  ).sort((a, b) => {
    const pr = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pr !== 0) return pr;
    return (
      DOMAIN_ORDER.indexOf(a.domain_id) - DOMAIN_ORDER.indexOf(b.domain_id)
    );
  });
}

export type AnswerStrategy = "convergent" | "divergent" | "rotating";

/**
 * Pick which of the 4 answers a partner should select for a given question.
 * Strategies are deterministic so failing tests are debuggable.
 *
 * - convergent: A and B both pick answer[0] every time → max agreement
 * - divergent:  A picks answer[0], B picks answer[1] → consistent disagreement
 * - rotating:   indexAtIndex % 4 — exercises all answer slots over the run
 */
export function pickAnswerId(
  q: Question,
  questionIndex: number,
  partner: "a" | "b",
  strategy: AnswerStrategy,
): string {
  switch (strategy) {
    case "convergent":
      return q.answers[0].id;
    case "divergent":
      return q.answers[partner === "a" ? 0 : 1].id;
    case "rotating": {
      const offset = partner === "a" ? 0 : 2;
      return q.answers[(questionIndex + offset) % q.answers.length].id;
    }
  }
}
