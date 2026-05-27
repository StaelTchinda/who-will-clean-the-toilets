import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchSession,
  fetchAnswers,
  fetchProgress,
  upsertAnswer,
  upsertProgress,
  markStarted,
  recallPartner,
  rememberPartner,
  type SessionRow,
  type AnswerRow,
  type ProgressRow,
  type Partner,
} from "@/lib/session";
import { buildQuestionList, ANGLE_BY_ID, DOMAIN_BY_ID } from "@/lib/dataset";
import { Button } from "@/components/ui/button";
import { ResultsView } from "@/components/results-view";
import { SwipeCard } from "@/components/swipe-card";

export const Route = createFileRoute("/s/$code")({
  component: SessionPage,
  head: () => ({
    meta: [{ title: "Questionnaire — Nos Rôles" }],
  }),
});

function SessionPage() {
  const { code } = Route.useParams();
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
      const [a, p] = await Promise.all([
        fetchAnswers(s.id),
        fetchProgress(s.id),
      ]);
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

  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`session:${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
        (payload) => {
          if (payload.new) setSession(payload.new as SessionRow);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progress", filter: `session_id=eq.${session.id}` },
        () => fetchProgress(session.id).then(setProgress),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "answers", filter: `session_id=eq.${session.id}` },
        () => fetchAnswers(session.id).then(setAnswers),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.id]);

  if (loading) {
    return (
      <Centered>
        <p className="text-muted-foreground">Chargement…</p>
      </Centered>
    );
  }

  if (notFound || !session) {
    return (
      <Centered>
        <h1 className="font-serif text-3xl">Session introuvable</h1>
        <p className="text-muted-foreground">
          Le code « {code} » ne correspond à aucune session active.
        </p>
        <Button onClick={() => navigate({ to: "/" })}>Retour à l'accueil</Button>
      </Centered>
    );
  }

  // No partner role on this device yet — ask which one they are
  if (!partner) {
    return (
      <PickPartner
        session={session}
        code={code}
        onPicked={(p) => setPartner(p)}
      />
    );
  }

  // Waiting for second partner to join
  if (!session.partner_b_name) {
    return <WaitingForJoin session={session} code={code} partner={partner} />;
  }

  const includeChildren =
    session.has_children_a !== "no" || session.has_children_b !== "no";
  const questions = buildQuestionList(includeChildren);

  const myAnswers = answers.filter((a) => a.partner === partner);
  const myProgress = progress.find((p) => p.partner === partner);
  const otherProgress = progress.find((p) => p.partner !== partner);

  const completed =
    myAnswers.length >= questions.length || myProgress?.completed;
  const otherCompleted = otherProgress?.completed;

  if (completed && otherCompleted) {
    return (
      <ResultsView
        session={session}
        answers={answers}
        questions={questions}
        includeChildren={includeChildren}
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
    <Questionnaire
      session={session}
      partner={partner}
      questions={questions}
      answers={myAnswers}
    />
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        {children}
      </div>
    </main>
  );
}

function PickPartner({
  session,
  code,
  onPicked,
}: {
  session: SessionRow;
  code: string;
  onPicked: (p: Partner) => void;
}) {
  const pick = (p: Partner) => {
    rememberPartner(code, p);
    onPicked(p);
  };
  return (
    <Centered>
      <h1 className="font-serif text-3xl">Qui est-ce ?</h1>
      <p className="text-muted-foreground">Sélectionne ton prénom sur ce téléphone.</p>
      <div className="flex w-full flex-col gap-3 pt-4">
        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-full"
          onClick={() => pick("a")}
        >
          {session.partner_a_name || "Partenaire A"}
        </Button>
        {session.partner_b_name && (
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-full"
            onClick={() => pick("b")}
          >
            {session.partner_b_name}
          </Button>
        )}
      </div>
    </Centered>
  );
}

function WaitingForJoin({
  session,
  code,
  partner,
}: {
  session: SessionRow;
  code: string;
  partner: Partner;
}) {
  const myName = partner === "a" ? session.partner_a_name : session.partner_b_name;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          Salut {myName} —
        </p>
        <h1 className="text-balance font-serif text-4xl leading-tight">
          Partage ce code avec ton partenaire.
        </h1>
        <button
          onClick={copy}
          className="group relative rounded-3xl border border-border bg-card px-10 py-6 transition hover:border-primary"
        >
          <span className="font-serif text-6xl tracking-[0.3em] text-foreground">
            {code}
          </span>
          <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">
            {copied ? "copié ✓" : "tap pour copier"}
          </span>
        </button>
        <p className="text-balance text-sm text-muted-foreground">
          Sur son téléphone, ton partenaire ouvre l'app, tape « Rejoindre avec
          un code », entre {code}, et son prénom.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-primary" />
          </span>
          en attente…
        </div>
      </div>
    </main>
  );
}

function WaitingForFinish({
  session,
  partner,
  otherProgress,
  totalQuestions,
}: {
  session: SessionRow;
  partner: Partner;
  otherProgress?: ProgressRow;
  totalQuestions: number;
}) {
  const otherName =
    partner === "a" ? session.partner_b_name : session.partner_a_name;
  const pct = otherProgress
    ? Math.round(
        ((otherProgress.current_index || 0) /
          Math.max(1, otherProgress.total || totalQuestions)) *
          100,
      )
    : 0;
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          Tu as terminé —
        </p>
        <h1 className="text-balance font-serif text-4xl leading-tight">
          On attend que {otherName} finisse.
        </h1>
        <div className="w-full">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {otherName} est à {pct}%
          </p>
        </div>
        <p className="max-w-xs text-balance text-sm text-muted-foreground">
          La page des résultats apparaîtra automatiquement quand vous aurez
          tous les deux fini.
        </p>
      </div>
    </main>
  );
}

function Questionnaire({
  session,
  partner,
  questions,
  answers,
}: {
  session: SessionRow;
  partner: Partner;
  questions: ReturnType<typeof buildQuestionList>;
  answers: AnswerRow[];
}) {
  const answeredIds = useMemo(
    () => new Set(answers.map((a) => a.question_id)),
    [answers],
  );
  // Start at first unanswered
  const initialIndex = useMemo(() => {
    const idx = questions.findIndex((q) => !answeredIds.has(q.id));
    return idx === -1 ? questions.length - 1 : idx;
  }, [questions, answeredIds]);

  const [index, setIndex] = useState(initialIndex);
  const [pending, setPending] = useState(false);
  const q = questions[index];
  const current = answers.find((a) => a.question_id === q.id)?.answer_id;

  const total = questions.length;
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

  if (index >= total) {
    return (
      <Centered>
        <p className="text-muted-foreground">Envoi de tes réponses…</p>
      </Centered>
    );
  }

  const domain = DOMAIN_BY_ID[q.domain_id];
  const angle = ANGLE_BY_ID[q.angle_id];

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-6 pt-[max(env(safe-area-inset-top),1rem)]">
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

        <div className="flex flex-1 items-center">
          <SwipeCard
            questionLabel={q.label}
            meta={`${domain.label} · ${angle.label}`}
            domainId={q.domain_id}
            answers={q.answers}
            current={current}
            onPick={handlePick}
          />
        </div>

        {pending && (
          <p className="text-center text-xs text-muted-foreground">envoi…</p>
        )}
      </div>
    </main>
  );
}