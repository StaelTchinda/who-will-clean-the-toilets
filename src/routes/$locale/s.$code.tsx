import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { backend } from "@/integrations/backend";
import {
  fetchSession,
  fetchAnswers,
  fetchProgress,
  upsertAnswer,
  upsertProgress,
  markStarted,
  recallPartner,
  type SessionRow,
  type AnswerRow,
  type ProgressRow,
  type Partner,
} from "@/lib/session";
import { buildQuestionList, ANGLE_BY_ID, DOMAIN_BY_ID } from "@/lib/dataset";
import { Button } from "@/components/ui/button";
import { ResultsView } from "@/components/ui/results-view";
import { FormStage, ModeSelect, QuestionHeader, SwipeStage } from "@/components/ui/swipe-card";
import { useInputMode, type InputMode } from "@/hooks/use-input-mode";
import { Centered } from "@/components/session/centered";
import { PickPartner } from "@/components/session/pick-partner";
import { WaitingForJoin } from "@/components/session/waiting-for-join";
import { WaitingForFinish } from "@/components/session/waiting-for-finish";
import i18n, { type Locale } from "@/i18n";

export const Route = createFileRoute("/$locale/s/$code")({
  component: SessionPage,
  head: ({ params }) => {
    const t = i18n.getFixedT(params.locale as Locale, "session");
    return {
      meta: [{ title: t("meta.title") }],
    };
  },
});

function SessionPage() {
  const { code, locale } = Route.useParams();
  const { t } = useTranslation("session");
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // initial load + realtime
  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await fetchSession(code);
      if (!mounted) return;
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSession(s);
      const [a, p] = await Promise.all([fetchAnswers(s.id), fetchProgress(s.id)]);
      if (!mounted) return;
      setAnswers(a);
      setProgress(p);
      setPartner(recallPartner(code));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [code]);

  // Live updates: backend.subscribeToSession is realtime on Supabase and
  // a 1.5s poll on Cloudflare D1 — same callback shape either way.
  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = backend.subscribeToSession(sessionId, {
      onSession: (next) => setSession(next),
      onProgress: (rows) => setProgress(rows),
      onAnswers: (rows) => setAnswers(rows),
    });
    return unsubscribe;
  }, [sessionId]);

  if (loading) {
    return (
      <Centered>
        <p className="text-muted-foreground">{t("loading")}</p>
      </Centered>
    );
  }

  if (notFound || !session) {
    return (
      <Centered>
        <h1 className="font-serif text-3xl">{t("notFound.title")}</h1>
        <p className="text-muted-foreground">{t("notFound.body", { code })}</p>
        <Button onClick={() => navigate({ to: "/$locale", params: { locale: locale as Locale } })}>
          {t("notFound.back")}
        </Button>
      </Centered>
    );
  }

  // No partner role on this device yet — ask which one they are
  if (!partner) {
    return <PickPartner session={session} code={code} onPicked={(p) => setPartner(p)} />;
  }

  // Waiting for second partner to join
  if (!session.partner_b_name) {
    return <WaitingForJoin session={session} code={code} partner={partner} />;
  }

  const includeChildren = session.has_children_a !== "no" || session.has_children_b !== "no";
  const questions = buildQuestionList(includeChildren);

  const myAnswers = answers.filter((a) => a.partner === partner);
  const myProgress = progress.find((p) => p.partner === partner);
  const otherProgress = progress.find((p) => p.partner !== partner);

  const completed = myAnswers.length >= questions.length || myProgress?.completed;
  const otherCompleted = otherProgress?.completed;

  if (completed && otherCompleted) {
    return (
      <ResultsView
        session={session}
        answers={answers}
        questions={questions}
        includeChildren={includeChildren}
        locale={locale as Locale}
      />
    );
  }

  if (completed && !otherCompleted) {
    return (
      <WaitingForFinish
        session={session}
        partner={partner}
        otherProgress={otherProgress}
        totalQuestions={questions.length}
      />
    );
  }

  return (
    <Questionnaire session={session} partner={partner} questions={questions} answers={myAnswers} />
  );
}

export function Questionnaire({
  session,
  partner,
  questions,
  answers,
  initialInputMode,
}: {
  session: SessionRow;
  partner: Partner;
  questions: ReturnType<typeof buildQuestionList>;
  answers: AnswerRow[];
  initialInputMode?: InputMode;
}) {
  const { t } = useTranslation("session");
  const { t: tData } = useTranslation("data");

  const answeredIds = useMemo(() => new Set(answers.map((a) => a.question_id)), [answers]);
  // Start at first unanswered
  const initialIndex = useMemo(() => {
    const idx = questions.findIndex((q) => !answeredIds.has(q.id));
    return idx === -1 ? questions.length - 1 : idx;
  }, [questions, answeredIds]);

  const [index, setIndex] = useState(initialIndex);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useInputMode(initialInputMode);
  const total = questions.length;

  // `q` and `current` may be undefined for one render tick after the final
  // pick — setIndex(total) puts us past the array until the parent flips to
  // WaitingForFinish / ResultsView. Access them defensively below and
  // early-return *after* every hook (Rules of Hooks).
  const q = questions[index];
  const current = q ? answers.find((a) => a.question_id === q.id)?.answer_id : undefined;

  const pct = Math.round(((index + (current ? 1 : 0)) / total) * 100);

  const persistProgress = useCallback(
    (newIndex: number, completed: boolean) => {
      upsertProgress({
        session_id: session.id,
        partner,
        current_index: newIndex,
        total,
        completed,
      }).catch(() => {});
    },
    [session.id, partner, total],
  );

  const handlePick = async (answerId: string) => {
    if (!q) return;
    setPending(true);
    try {
      await upsertAnswer({
        session_id: session.id,
        partner,
        question_id: q.id,
        answer_id: answerId,
      });
      if (index === 0) {
        await markStarted(session.id);
      }
      const isLast = index === total - 1;
      const nextIndex = isLast ? total : index + 1;
      persistProgress(nextIndex, isLast);
      if (!isLast) setIndex(index + 1);
      else setIndex(total);
    } finally {
      setPending(false);
    }
  };

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  // All hooks have run by now — safe to bail out before dereferencing q.
  if (!q) {
    return (
      <Centered>
        <p className="text-muted-foreground">{t("sending")}</p>
      </Centered>
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

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-6 pt-[max(env(safe-area-inset-top),1rem)] md:max-w-lg lg:max-w-xl">
        {/* progress */}
        <div className="flex items-center gap-3 pb-6">
          <button
            onClick={handlePrev}
            disabled={index === 0}
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
          <ModeSelect mode={mode} onChange={setMode} />
        </div>

        <QuestionHeader
          questionLabel={questionLabel}
          meta={`${domainLabel} · ${angleLabel}`}
          domainId={q.domain_id}
          modified={!!current}
        />

        <div className="flex flex-1 items-start pt-2 md:items-center md:pb-12">
          {mode === "swipe" && (
            // key={q.id} forces a fresh mount per question so SwipeStage's
            // internal `locked`/drag state can never leak across questions —
            // the symptom was a "dead" next card when consecutive questions
            // happened to share their first answer id.
            <SwipeStage
              key={q.id}
              domainId={q.domain_id}
              answers={translatedAnswers}
              current={current}
              onPick={handlePick}
            />
          )}
          {mode === "form" && (
            <FormStage answers={translatedAnswers} current={current} onPick={handlePick} />
          )}
        </div>

        {pending && <p className="text-center text-xs text-muted-foreground">{t("sending")}</p>}
      </div>
    </main>
  );
}
