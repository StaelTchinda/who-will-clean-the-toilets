import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { compareAnswers, groupByDomain, pickHighlights, suggestAssignments } from "@/lib/analysis";
import type { Highlight } from "@/lib/analysis";
import type { Question } from "@/lib/dataset";
import { DOMAIN_BY_ID } from "@/lib/dataset";
import type { AnswerRow, SessionRow } from "@/lib/session";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n";

export function ResultsView({
  session,
  answers,
  questions,
  includeChildren,
  locale,
}: {
  session: SessionRow;
  answers: AnswerRow[];
  questions: Question[];
  includeChildren: boolean;
  locale: Locale;
}) {
  const { t } = useTranslation("results");
  const { t: tData } = useTranslation("data");
  const navigate = useNavigate();
  const nameA = session.partner_a_name || "A";
  const nameB = session.partner_b_name || "B";

  const compared = useMemo(() => compareAnswers(questions, answers), [questions, answers]);
  const grouped = useMemo(() => groupByDomain(compared), [compared]);
  const highlights = useMemo(() => pickHighlights(compared), [compared]);
  const suggestions = useMemo(
    () => suggestAssignments(session, answers, includeChildren),
    [session, answers, includeChildren],
  );

  const [tab, setTab] = useState<"analysis" | "table" | "tasks">("analysis");

  const overall = Math.round(
    (compared.filter((c) => c.alignment === "converge").length / Math.max(1, compared.length)) *
      100,
  );

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-[max(env(safe-area-inset-top),1.5rem)] lg:max-w-4xl lg:px-8">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("meta.eyebrow")}</p>
        <h1 className="mt-3 text-balance font-serif text-4xl leading-tight sm:text-5xl">
          {nameA} <span className="text-muted-foreground">&</span> {nameB}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("convergence", { pct: overall })}</p>

        <div className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-secondary p-1 text-sm">
          {(
            [
              ["analysis", t("tabs.analysis")],
              ["table", t("tabs.table")],
              ["tasks", t("tabs.tasks")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3 py-2 transition ${
                tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "analysis" && (
            <AnalysisSection
              highlights={highlights}
              grouped={grouped}
              nameA={nameA}
              nameB={nameB}
            />
          )}
          {tab === "table" && <TableSection grouped={grouped} nameA={nameA} nameB={nameB} />}
          {tab === "tasks" && (
            <TasksSection suggestions={suggestions} nameA={nameA} nameB={nameB} />
          )}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-8">
          <p className="text-xs text-muted-foreground">{t("footer.disclaimer")}</p>
          <Button
            variant="outline"
            className="rounded-full sm:self-start sm:px-8"
            onClick={() => navigate({ to: "/$locale", params: { locale } })}
          >
            {t("footer.newQuestionnaire")}
          </Button>
        </div>
      </div>
    </main>
  );
}

export function AnalysisSection({
  highlights,
  grouped,
  nameA,
  nameB,
  hideOverview = false,
  disableGrid = false,
}: {
  highlights: ReturnType<typeof pickHighlights>;
  grouped: ReturnType<typeof groupByDomain>;
  nameA: string;
  nameB: string;
  hideOverview?: boolean;
  disableGrid?: boolean;
}) {
  const { t } = useTranslation("results");
  const { t: tData } = useTranslation("data");

  function renderDetail(h: Highlight) {
    if (h.detailKey === "analysis.alignedDetail") {
      const answer = h.answerAId
        ? tData(`questions.${h.questionId}.answers.${h.answerAId}`, {
            defaultValue: h.answerALabel ?? "",
          })
        : (h.answerALabel ?? "");
      return t("analysis.alignedDetail", { answer });
    }
    return t("analysis.divergedDetail");
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-serif text-2xl">{t("analysis.alignedTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("analysis.alignedSub")}</p>
        <ul className={`mt-4 grid gap-3 ${disableGrid ? "grid-cols-1" : "md:grid-cols-2"}`}>
          {highlights.aligned.length === 0 && (
            <li className="text-sm text-muted-foreground">{t("analysis.alignedEmpty")}</li>
          )}
          {highlights.aligned.map((h, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-converge)]">
                {tData(`domains.${h.domainId}`, { defaultValue: h.domainId })}
              </p>
              <p className="mt-1 font-serif text-lg leading-snug">
                {tData(`questions.${h.questionId}.label`, { defaultValue: h.questionLabel })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{renderDetail(h)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("analysis.divergedTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("analysis.divergedSub")}</p>
        <ul className={`mt-4 grid gap-3 ${disableGrid ? "grid-cols-1" : "md:grid-cols-2"}`}>
          {highlights.diverged.length === 0 && (
            <li className="text-sm text-muted-foreground">{t("analysis.divergedEmpty")}</li>
          )}
          {highlights.diverged.map((h, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-diverge)]">
                {tData(`domains.${h.domainId}`, { defaultValue: h.domainId })}
              </p>
              <p className="mt-1 font-serif text-lg leading-snug">
                {tData(`questions.${h.questionId}.label`, { defaultValue: h.questionLabel })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{renderDetail(h)}</p>
            </li>
          ))}
        </ul>
      </section>

      {!hideOverview && (
        <section>
          <h2 className="font-serif text-2xl">{t("analysis.overviewTitle")}</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {grouped.map((g) => (
              <li key={g.domain.id} className="flex items-center gap-3 rounded-xl bg-card p-3">
                <span className="w-32 shrink-0 text-sm">
                  {tData(`domains.${g.domain.id}`, { defaultValue: g.domain.label })}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.round(g.convergence * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                  {Math.round(g.convergence * 100)}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("analysis.overviewSub", { nameA, nameB })}
          </p>
        </section>
      )}
    </div>
  );
}

export function TableSection({
  grouped,
  nameA,
  nameB,
}: {
  grouped: ReturnType<typeof groupByDomain>;
  nameA: string;
  nameB: string;
}) {
  const { t: tData } = useTranslation("data");

  return (
    <div className="flex flex-col gap-8">
      {grouped.map((g) => (
        <section key={g.domain.id}>
          <h3 className="font-serif text-xl">
            {tData(`domains.${g.domain.id}`, { defaultValue: g.domain.label })}
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {g.rows.map((r) => {
              const labelA = r.answerA
                ? tData(`questions.${r.question.id}.answers.${r.answerA}`, {
                    defaultValue: r.labelA ?? "—",
                  })
                : r.labelA;
              const labelB = r.answerB
                ? tData(`questions.${r.question.id}.answers.${r.answerB}`, {
                    defaultValue: r.labelB ?? "—",
                  })
                : r.labelB;
              const questionLabel = tData(`questions.${r.question.id}.label`, {
                defaultValue: r.question.label,
              });
              return (
                <li
                  key={r.question.id}
                  className={`rounded-xl border p-3 ${
                    r.alignment === "converge"
                      ? "border-[color:var(--color-converge)]/40 bg-[color:var(--color-converge)]/5"
                      : r.alignment === "diverge"
                        ? "border-[color:var(--color-diverge)]/40 bg-[color:var(--color-diverge)]/5"
                        : "border-border bg-card"
                  }`}
                >
                  <p className="text-sm font-medium leading-snug">{questionLabel}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {nameA}
                      </p>
                      <p className="mt-0.5 text-foreground">{labelA ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {nameB}
                      </p>
                      <p className="mt-0.5 text-foreground">{labelB ?? "—"}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function TasksSection({
  suggestions,
  nameA,
  nameB,
}: {
  suggestions: ReturnType<typeof suggestAssignments>;
  nameA: string;
  nameB: string;
}) {
  const { t } = useTranslation("results");
  const { t: tData } = useTranslation("data");

  const byDomain = new Map<string, typeof suggestions>();
  for (const s of suggestions) {
    const list = byDomain.get(s.domainId) || [];
    list.push(s);
    byDomain.set(s.domainId, list);
  }

  const assigneeLabel = (a: "a" | "b" | "share") =>
    a === "a" ? nameA : a === "b" ? nameB : t("tasks.share");

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">{t("tasks.intro")}</p>
      {Array.from(byDomain.entries()).map(([dId, items]) => {
        const domainObj = DOMAIN_BY_ID[dId as keyof typeof DOMAIN_BY_ID];
        return (
          <section key={dId}>
            <h3 className="font-serif text-xl">
              {tData(`domains.${dId}`, { defaultValue: domainObj?.label ?? dId })}
            </h3>
            <ul className="mt-3 grid gap-2 lg:grid-cols-2">
              {items.map((s) => {
                const taskLabel = tData(`tasks.${s.taskId}`, { defaultValue: s.taskLabel });
                const rationale = t(s.rationaleKey, s.rationaleValues);
                return (
                  <li
                    key={s.taskId}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{taskLabel}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{rationale}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                        s.assignee === "share"
                          ? "bg-secondary text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {assigneeLabel(s.assignee)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
