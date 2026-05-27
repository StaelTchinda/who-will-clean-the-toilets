import questionsJson from "@/data/questions.json";
import tasksJson from "@/data/tasks.json";
import anglesJson from "@/data/angles.json";
import domainsJson from "@/data/domains.json";

export type Priority = "essential" | "important" | "nice_to_have";
export type AngleId = "environment" | "talent" | "preference" | "value";
export type DomainId =
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

export interface Task {
  id: string;
  label: string;
  domain_id: DomainId;
}

export interface Angle {
  id: AngleId;
  label: string;
  description: string;
}

export interface Domain {
  id: DomainId;
  label: string;
}

export const QUESTIONS = questionsJson as Question[];
export const TASKS = tasksJson as Task[];
export const ANGLES = anglesJson as Angle[];
export const DOMAINS = domainsJson as Domain[];

export const ANGLE_BY_ID: Record<AngleId, Angle> = Object.fromEntries(
  ANGLES.map((a) => [a.id, a]),
) as Record<AngleId, Angle>;

export const DOMAIN_BY_ID: Record<DomainId, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d]),
) as Record<DomainId, Domain>;

export const TASK_BY_ID: Record<string, Task> = Object.fromEntries(TASKS.map((t) => [t.id, t]));

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

export function buildQuestionList(includeChildren: boolean): Question[] {
  return QUESTIONS.filter((q) => includeChildren || q.domain_id !== "children").sort((a, b) => {
    const pr = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pr !== 0) return pr;
    return DOMAIN_ORDER.indexOf(a.domain_id) - DOMAIN_ORDER.indexOf(b.domain_id);
  });
}

export function answerById(q: Question, id: string): Answer | undefined {
  return q.answers.find((a) => a.id === id);
}
