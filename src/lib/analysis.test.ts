import { describe, it, expect } from "vitest";
import {
  compareAnswers,
  groupByDomain,
  pickHighlights,
  suggestAssignments,
  type ComparedQuestion,
} from "@/lib/analysis";
import { buildQuestionList, TASKS } from "@/lib/dataset";
import { answer, makeQuestion, makeSession } from "@/test/fixtures";

// ── compareAnswers / classify ────────────────────────────────────────────────

describe("compareAnswers", () => {
  const q = makeQuestion({
    id: "q1",
    answers: [
      { id: "mother", label: "Ma mère", icon: "Venus", position: "up" },
      { id: "father", label: "Mon père", icon: "Mars", position: "down" },
      { id: "both_fine", label: "Les deux", icon: "CheckCheck", position: "right" },
      { id: "neither_fine", label: "Aucun", icon: "CircleSlash", position: "left" },
    ],
  });

  it("classifies a missing answer (either side) as neutral", () => {
    expect(compareAnswers([q], [answer("a", "q1", "mother")])[0].alignment).toBe("neutral");
    expect(compareAnswers([q], [answer("b", "q1", "mother")])[0].alignment).toBe("neutral");
    expect(compareAnswers([q], [])[0].alignment).toBe("neutral");
  });

  it("classifies identical answers as converge", () => {
    const [row] = compareAnswers([q], [answer("a", "q1", "mother"), answer("b", "q1", "mother")]);
    expect(row.alignment).toBe("converge");
  });

  it("treats both_/neither_ prefix pairs as soft converge", () => {
    const pairs: Array<[string, string]> = [
      ["both_fine", "both_bother"],
      ["both_fine", "neither_fine"],
      ["neither_fine", "neither_else"],
    ];
    for (const [a, b] of pairs) {
      const [row] = compareAnswers([q], [answer("a", "q1", a), answer("b", "q1", b)]);
      expect(row.alignment, `${a} vs ${b}`).toBe("converge");
    }
  });

  it("diverges when only one side is a soft answer", () => {
    const [row] = compareAnswers(
      [q],
      [answer("a", "q1", "both_fine"), answer("b", "q1", "mother")],
    );
    expect(row.alignment).toBe("diverge");
  });

  it("diverges on plain different concrete answers", () => {
    const [row] = compareAnswers([q], [answer("a", "q1", "mother"), answer("b", "q1", "father")]);
    expect(row.alignment).toBe("diverge");
  });

  it("resolves answer labels and leaves unknown ids without a label", () => {
    const [row] = compareAnswers([q], [answer("a", "q1", "mother"), answer("b", "q1", "ghost")]);
    expect(row.labelA).toBe("Ma mère");
    expect(row.answerB).toBe("ghost");
    expect(row.labelB).toBeUndefined();
  });

  it("returns one row per question, preserving order", () => {
    const q2 = makeQuestion({ id: "q2" });
    const rows = compareAnswers([q, q2], [answer("a", "q1", "mother")]);
    expect(rows.map((r) => r.question.id)).toEqual(["q1", "q2"]);
  });
});

// ── groupByDomain ─────────────────────────────────────────────────────────────

describe("groupByDomain", () => {
  const mk = (
    domain_id: ComparedQuestion["question"]["domain_id"],
    alignment: ComparedQuestion["alignment"],
  ): ComparedQuestion => ({
    question: makeQuestion({ domain_id }),
    alignment,
  });

  it("drops domains with no rows and keeps only present ones", () => {
    const groups = groupByDomain([mk("cooking", "converge")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].domain.id).toBe("cooking");
  });

  it("computes convergence as converge / total", () => {
    const groups = groupByDomain([
      mk("housekeeping", "converge"),
      mk("housekeeping", "converge"),
      mk("housekeeping", "diverge"),
    ]);
    expect(groups[0].convergence).toBeCloseTo(2 / 3);
  });

  it("is 0 when a domain has no converging rows", () => {
    const groups = groupByDomain([mk("finances", "diverge"), mk("finances", "neutral")]);
    expect(groups[0].convergence).toBe(0);
  });

  it("orders groups following the DOMAINS array (housekeeping before cooking)", () => {
    const groups = groupByDomain([mk("cooking", "converge"), mk("housekeeping", "converge")]);
    expect(groups.map((g) => g.domain.id)).toEqual(["housekeeping", "cooking"]);
  });
});

// ── pickHighlights ────────────────────────────────────────────────────────────

describe("pickHighlights", () => {
  const converge = (i: number, labelA: string | undefined = `L${i}`): ComparedQuestion => ({
    question: makeQuestion({ id: `c${i}`, label: `converge ${i}` }),
    alignment: "converge",
    labelA,
  });
  // Note: a default param only kicks in for `undefined`, so build the
  // missing-label case explicitly rather than passing `undefined`.
  const convergeNoLabel = (i: number): ComparedQuestion => ({
    question: makeQuestion({ id: `c${i}`, label: `converge ${i}` }),
    alignment: "converge",
    labelA: undefined,
  });
  const diverge = (i: number): ComparedQuestion => ({
    question: makeQuestion({ id: `d${i}`, label: `diverge ${i}` }),
    alignment: "diverge",
  });

  it("returns empty lists for no rows", () => {
    expect(pickHighlights([])).toEqual({ aligned: [], diverged: [] });
  });

  it("excludes converge rows that have no labelA", () => {
    const { aligned } = pickHighlights([convergeNoLabel(1), converge(2, "Oui")]);
    expect(aligned).toHaveLength(1);
    expect(aligned[0].questionLabel).toBe("converge 2");
  });

  it("caps each list at 3", () => {
    const rows = [1, 2, 3, 4, 5].flatMap((i) => [converge(i), diverge(i)]);
    const { aligned, diverged } = pickHighlights(rows);
    expect(aligned).toHaveLength(3);
    expect(diverged).toHaveLength(3);
  });

  it("stores labelA in answerALabel for the aligned detail", () => {
    const { aligned } = pickHighlights([converge(1, "Toujours moi")]);
    expect(aligned[0].detailKey).toBe("analysis.alignedDetail");
    expect(aligned[0].answerALabel).toBe("Toujours moi");
  });
});

// ── suggestAssignments ────────────────────────────────────────────────────────

describe("suggestAssignments", () => {
  const session = makeSession();

  it("returns share with no-preference rationale when there is no evidence", () => {
    // No talent/preference questions in the real QUESTIONS reference a fake task,
    // but suggestAssignments iterates the real TASKS. Pick a real task and supply
    // no answers → every suggestion has evidence 0.
    const out = suggestAssignments(session, [], true);
    expect(out.length).toBeGreaterThan(0);
    for (const s of out) {
      expect(s.assignee).toBe("share");
      expect(s.rationaleKey).toBe("tasks.rationaleNoData");
    }
  });

  it("excludes children tasks when includeChildren is false", () => {
    const childTasks = TASKS.filter((t) => t.domain_id === "children").length;
    const all = suggestAssignments(session, [], true);
    const noKids = suggestAssignments(session, [], false);
    expect(all).toHaveLength(TASKS.length);
    expect(noKids).toHaveLength(TASKS.length - childTasks);
    expect(noKids.some((s) => s.domainId === "children")).toBe(false);
  });

  // For precise scoring/assignee branches we drive the REAL questions/tasks via a
  // known talent question. q_housekeeping_talent_sanitizing_vs_floors links tasks
  // ["sanitizing","floor_washing"] with a direct-pick answer "sanitizing".
  const QID = "q_housekeeping_talent_sanitizing_vs_floors";

  it("assigns to A (with their name) when A scores higher", () => {
    const out = suggestAssignments(session, [answer("a", QID, "sanitizing")], true);
    const sani = out.find((s) => s.taskId === "sanitizing")!;
    expect(sani.assignee).toBe("a");
    expect(sani.rationaleKey).toBe("tasks.rationaleA");
    expect(sani.rationaleValues?.name).toBe("Camille");
  });

  it("assigns to B (with their name) when B scores higher", () => {
    const out = suggestAssignments(session, [answer("b", QID, "sanitizing")], true);
    const sani = out.find((s) => s.taskId === "sanitizing")!;
    expect(sani.assignee).toBe("b");
    expect(sani.rationaleKey).toBe("tasks.rationaleB");
    expect(sani.rationaleValues?.name).toBe("Alex");
  });

  it("shares on a tie (both directly pick the same task)", () => {
    const out = suggestAssignments(
      session,
      [answer("a", QID, "sanitizing"), answer("b", QID, "sanitizing")],
      true,
    );
    const sani = out.find((s) => s.taskId === "sanitizing")!;
    expect(sani.assignee).toBe("share");
    expect(sani.rationaleKey).toBe("tasks.rationaleTie");
  });

  it("falls back to 'A'/'B' when names are null", () => {
    const anon = makeSession({ partner_a_name: null, partner_b_name: null });
    const out = suggestAssignments(anon, [answer("a", QID, "sanitizing")], true);
    const sani = out.find((s) => s.taskId === "sanitizing")!;
    expect(sani.rationaleKey).toBe("tasks.rationaleA");
    expect(sani.rationaleValues?.name).toBe("A");
  });
});

// ── Real-dataset integration smoke (structural invariants only) ───────────────

describe("real dataset pipeline (smoke)", () => {
  const session = makeSession();
  const buildAnswers = (questions: ReturnType<typeof buildQuestionList>) =>
    questions.flatMap((q) => [
      answer("a", q.id, q.answers[0]?.id ?? "x"),
      answer("b", q.id, q.answers[Math.min(1, q.answers.length - 1)]?.id ?? "x"),
    ]);

  it("compareAnswers/groupByDomain produce valid convergence ratios over real data", () => {
    const questions = buildQuestionList(true);
    const compared = compareAnswers(questions, buildAnswers(questions));
    expect(compared).toHaveLength(questions.length);
    for (const g of groupByDomain(compared)) {
      expect(g.convergence).toBeGreaterThanOrEqual(0);
      expect(g.convergence).toBeLessThanOrEqual(1);
      expect(g.rows.length).toBeGreaterThan(0);
    }
  });

  it("suggestAssignments covers tasks and respects includeChildren over real data", () => {
    const questions = buildQuestionList(true);
    const answers = buildAnswers(questions);
    const withKids = suggestAssignments(session, answers, true);
    const noKids = suggestAssignments(session, answers, false);

    expect(withKids).toHaveLength(TASKS.length);
    expect(noKids.every((s) => s.domainId !== "children")).toBe(true);
    for (const s of withKids) {
      expect(["a", "b", "share"]).toContain(s.assignee);
      expect(s.rationaleKey.length).toBeGreaterThan(0);
    }
  });
});
