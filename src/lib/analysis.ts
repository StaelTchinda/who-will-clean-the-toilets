import {
  QUESTIONS,
  DOMAINS,
  TASKS,
  DOMAIN_BY_ID,
  TASK_BY_ID,
  answerById,
  type Question,
  type DomainId,
} from "./dataset";
import type { AnswerRow, SessionRow } from "./session";

export type Alignment = "converge" | "diverge" | "neutral";

export interface ComparedQuestion {
  question: Question;
  answerA?: string;
  answerB?: string;
  labelA?: string;
  labelB?: string;
  alignment: Alignment;
}

function classify(q: Question, a?: string, b?: string): Alignment {
  if (!a || !b) return "neutral";
  if (a === b) return "converge";
  // "both_fine" and similar shared-answer ids count as soft converge
  if (
    (a.startsWith("both") || a.startsWith("neither")) &&
    (b.startsWith("both") || b.startsWith("neither"))
  )
    return "converge";
  return "diverge";
}

export function compareAnswers(
  questions: Question[],
  answers: AnswerRow[],
): ComparedQuestion[] {
  const byPartner = (p: "a" | "b") =>
    new Map(answers.filter((x) => x.partner === p).map((x) => [x.question_id, x.answer_id]));
  const mapA = byPartner("a");
  const mapB = byPartner("b");
  return questions.map((q) => {
    const a = mapA.get(q.id);
    const b = mapB.get(q.id);
    return {
      question: q,
      answerA: a,
      answerB: b,
      labelA: a ? answerById(q, a)?.label : undefined,
      labelB: b ? answerById(q, b)?.label : undefined,
      alignment: classify(q, a, b),
    };
  });
}

export interface DomainGroup {
  domain: { id: DomainId; label: string };
  rows: ComparedQuestion[];
  convergence: number; // 0..1
}

export function groupByDomain(rows: ComparedQuestion[]): DomainGroup[] {
  return DOMAINS.map((d) => {
    const r = rows.filter((row) => row.question.domain_id === d.id);
    if (r.length === 0) return null;
    const conv = r.filter((x) => x.alignment === "converge").length;
    return {
      domain: d,
      rows: r,
      convergence: r.length ? conv / r.length : 0,
    };
  }).filter(Boolean) as DomainGroup[];
}

/**
 * Highlight uses structured data so the component can translate at render time.
 * - domainId: used with tData(`domains.${domainId}`) for translated domain label
 * - questionId: used with tData(`questions.${questionId}.label`) for translated question
 * - questionLabel: French fallback for tData defaultValue
 * - detailKey: i18n key in the "results" namespace (analysis.alignedDetail or analysis.divergedDetail)
 * - answerAId / answerALabel: present for aligned highlights, used to translate the shared answer
 */
export interface Highlight {
  domainId: DomainId;
  questionId: string;
  questionLabel: string;
  detailKey: string;
  answerAId?: string;
  answerALabel?: string;
}

export function pickHighlights(rows: ComparedQuestion[]) {
  const aligned = rows.filter((r) => r.alignment === "converge" && r.labelA);
  const diverged = rows.filter((r) => r.alignment === "diverge");
  return {
    aligned: aligned.slice(0, 3).map<Highlight>((r) => ({
      domainId: r.question.domain_id,
      questionId: r.question.id,
      questionLabel: r.question.label,
      detailKey: "analysis.alignedDetail",
      answerAId: r.answerA,
      answerALabel: r.labelA,
    })),
    diverged: diverged.slice(0, 3).map<Highlight>((r) => ({
      domainId: r.question.domain_id,
      questionId: r.question.id,
      questionLabel: r.question.label,
      detailKey: "analysis.divergedDetail",
    })),
  };
}

export type Assignee = "a" | "b" | "share";

/**
 * TaskSuggestion uses translation keys for rationale so the component
 * can render the correct language without passing a `t` function into this module.
 */
export interface TaskSuggestion {
  taskId: string;
  taskLabel: string;
  domainId: DomainId;
  assignee: Assignee;
  rationaleKey: string;
  rationaleValues?: Record<string, string>;
}

/**
 * For each task, look at all Talent + Preference questions that include the task.
 * Score partners: +2 if they "pick" the task in their answer (answer id equals task id or starts with task),
 * +1 if they answer "both_fine" / "both" (versatile), -1 if "both_bother" / "neither".
 * Combine across both angles. Whoever scores higher gets the task; tie → share.
 */
export function suggestAssignments(
  session: SessionRow,
  answers: AnswerRow[],
  includeChildren: boolean,
): TaskSuggestion[] {
  const mapA = new Map(
    answers.filter((x) => x.partner === "a").map((x) => [x.question_id, x.answer_id]),
  );
  const mapB = new Map(
    answers.filter((x) => x.partner === "b").map((x) => [x.question_id, x.answer_id]),
  );

  const relevantQ = QUESTIONS.filter(
    (q) =>
      (q.angle_id === "talent" || q.angle_id === "preference") &&
      q.task_ids.length >= 1,
  );

  return TASKS.filter(
    (t) => includeChildren || t.domain_id !== "children",
  ).map((task) => {
    const qs = relevantQ.filter((q) => q.task_ids.includes(task.id));
    let scoreA = 0;
    let scoreB = 0;
    let evidence = 0;
    for (const q of qs) {
      const a = mapA.get(q.id);
      const b = mapB.get(q.id);
      if (a) {
        evidence++;
        scoreA += scoreFor(a, task.id, q.angle_id);
      }
      if (b) {
        evidence++;
        scoreB += scoreFor(b, task.id, q.angle_id);
      }
    }

    const nameA = session.partner_a_name || "A";
    const nameB = session.partner_b_name || "B";

    let assignee: Assignee;
    let rationaleKey: string;
    let rationaleValues: Record<string, string> | undefined;

    if (evidence === 0) {
      assignee = "share";
      rationaleKey = "tasks.rationaleNoData";
    } else if (scoreA === scoreB) {
      assignee = "share";
      rationaleKey = "tasks.rationaleTie";
    } else if (scoreA > scoreB) {
      assignee = "a";
      rationaleKey = "tasks.rationaleA";
      rationaleValues = { name: nameA };
    } else {
      assignee = "b";
      rationaleKey = "tasks.rationaleB";
      rationaleValues = { name: nameB };
    }

    return {
      taskId: task.id,
      taskLabel: task.label,
      domainId: task.domain_id,
      assignee,
      rationaleKey,
      rationaleValues,
    };
  });
}

function scoreFor(answerId: string, taskId: string, angle: string): number {
  // Direct pick — the partner names this task explicitly
  if (answerId === taskId) return angle === "talent" ? 3 : 2;
  // Common shared answer ids
  if (answerId === "both_fine") return 1;
  if (answerId === "both_bother" || answerId === "neither_fine") return -1;
  // Fallback: answer id contains task id (e.g. "groceries" vs "groceries")
  if (taskId.includes(answerId) || answerId.includes(taskId))
    return angle === "talent" ? 2 : 1;
  return 0;
}

// Suppress unused import warning
void TASK_BY_ID;
