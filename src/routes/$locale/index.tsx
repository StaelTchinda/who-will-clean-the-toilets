import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FormStage, ModeSelect, QuestionHeader, SwipeStage } from "@/components/ui/swipe-card";
import { AnalysisSection } from "@/components/ui/results-view";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Answer, DomainId } from "@/lib/dataset";
import type { Highlight } from "@/lib/analysis";
import { useInputMode } from "@/hooks/use-input-mode";
import { ArrowRight, Heart, BookOpen, Compass } from "lucide-react";
import { createSession, joinSession, rememberPartner, type ChildrenAnswer } from "@/lib/session";
import i18n, { type Locale } from "@/i18n";
import { useLocale } from "@/hooks/use-locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/$locale/")({
  component: HomePage,
  head: ({ params }) => {
    const t = i18n.getFixedT(params.locale as Locale, "home");
    return {
      meta: [{ title: t("meta.title") }, { name: "description", content: t("meta.description") }],
    };
  },
});

// Live, scaled-down replica of the real questionnaire surface: the same
// QuestionHeader, the same ModeSelect, and the same SwipeStage / FormStage —
// fed a single sample question so the home page always mirrors what the
// session screen actually renders. Interactive (the puck morphs, the toggle
// flips), but onPick is a no-op so it never navigates.
function SwipePreview() {
  const { t } = useTranslation("home");
  const [mode, setMode] = useInputMode("swipe");
  const previewAnswers: Answer[] = [
    { id: "both", label: t("swipePreview.both"), icon: "Users", position: "up" },
    { id: "mother", label: t("swipePreview.maman"), icon: "Venus", position: "left" },
    { id: "father", label: t("swipePreview.papa"), icon: "Mars", position: "right" },
    { id: "everyone", label: t("swipePreview.everyone"), icon: "UsersRound", position: "down" },
  ];

  return (
    <div className="relative rounded-3xl border border-border bg-card p-5">
      {/* <div className="rounded-2xl border border-border bg-background px-4 pb-4 pt-3"> */}
      <div>
        <div className="mb-3 flex justify-end">
          <ModeSelect mode={mode} onChange={setMode} />
        </div>
        <QuestionHeader
          questionLabel={t("swipePreview.question")}
          meta={t("swipePreview.meta")}
          domainId="housekeeping"
        />
        <div className="flex items-start pt-2">
          {mode === "swipe" ? (
            <SwipeStage domainId="housekeeping" answers={previewAnswers} onPick={() => {}} />
          ) : (
            <FormStage answers={previewAnswers} onPick={() => {}} />
          )}
        </div>
      </div>
    </div>
  );
}

// Sample data shaped exactly like the real analysis props. Domain/question ids
// don't exist in the `data` namespace, so the section falls back to these
// labels via tData(..., { defaultValue }) — keeping the preview faithful to
// the real AnalysisSection without re-implementing its cards or bars.
function useResultsFixture() {
  const { t } = useTranslation("home");

  const aligned: Highlight[] = [
    {
      domainId: "cooking",
      questionId: "preview-cooking",
      questionLabel: t("resultPreview.sampleQuestionA"),
      detailKey: "analysis.alignedDetail",
      answerAId: "preview-both",
      answerALabel: t("resultPreview.sampleAlignedAnswer"),
    },
  ];
  const diverged: Highlight[] = [
    {
      domainId: "housekeeping",
      questionId: "preview-housekeeping",
      questionLabel: t("resultPreview.sampleQuestionB"),
      detailKey: "analysis.divergedDetail",
    },
  ];

  const bar = (id: DomainId, label: string, convergence: number) => ({
    domain: { id, label },
    rows: [],
    convergence,
  });
  const grouped = [
    bar("housekeeping", t("resultPreview.domainHousekeeping"), 0.62),
    bar("cooking", t("resultPreview.domainCooking"), 0.83),
    bar("finances", t("resultPreview.domainFinances"), 0.41),
  ];

  return { highlights: { aligned, diverged }, grouped };
}

function ResultsPreview() {
  const { t } = useTranslation("home");
  const { t: tResults } = useTranslation("results");
  const { highlights, grouped } = useResultsFixture();

  return (
    <div className="relative rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          {tResults("meta.eyebrow")}
        </p>
        <Heart className="size-3.5 text-primary" />
      </div>

      <h3 className="mt-3 font-serif text-2xl leading-tight">
        {t("resultPreview.nameA")} <span className="text-muted-foreground">&</span>{" "}
        {t("resultPreview.nameB")}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{tResults("convergence", { pct: 62 })}</p>

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-full bg-secondary p-1 text-xs">
        <span className="rounded-full bg-card px-3 py-2 text-center text-foreground shadow-sm">
          {tResults("tabs.analysis")}
        </span>
        <span className="rounded-full px-3 py-2 text-center text-muted-foreground">
          {tResults("tabs.table")}
        </span>
        <span className="rounded-full px-3 py-2 text-center text-muted-foreground">
          {tResults("tabs.tasks")}
        </span>
      </div>

      <div className="pointer-events-none mt-6">
        <AnalysisSection
          highlights={highlights}
          grouped={grouped}
          nameA={t("resultPreview.nameA")}
          nameB={t("resultPreview.nameB")}
        />
      </div>
    </div>
  );
}

export type Mode = "intro" | "create" | "join";

/**
 * Centering chrome shared by HomePage and Storybook stories — max-w-md layout,
 * brand header with LanguageSwitcher, and Chapman footer. Translated via i18n so
 * the Storybook locale toolbar immediately updates header and footer text.
 */
export function HomeShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("home");
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("brand")}</p>
          <LanguageSwitcher />
        </header>
        {children}
        <footer className="mt-auto pt-10 text-xs text-muted-foreground">{t("footer")}</footer>
      </div>
    </main>
  );
}

function HomePage() {
  const [mode, setMode] = useState<Mode>("intro");

  return (
    <HomeShell>
      {mode === "intro" && <Intro onChoose={setMode} />}
      {mode === "create" && <CreateForm onBack={() => setMode("intro")} />}
      {mode === "join" && <JoinForm onBack={() => setMode("intro")} />}
    </HomeShell>
  );
}

export function Intro({ onChoose }: { onChoose: (m: Mode) => void }) {
  const { t } = useTranslation("home");
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <div className="flex flex-col gap-6">
        <h1 className="text-pretty text-5xl leading-[1.02] text-foreground">
          {t("hero.heading1")}
          <br />
          <em className="text-primary">{t("hero.heading2")}</em>
        </h1>
        <p className="text-balance text-base leading-relaxed text-muted-foreground">
          {t("hero.subtext")}
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            size="lg"
            className="h-14 rounded-full text-base"
            onClick={() => onChoose("create")}
          >
            {t("hero.ctaCreate")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-14 rounded-full text-base"
            onClick={() => onChoose("join")}
          >
            {t("hero.ctaJoin")}
          </Button>
        </div>
        <ul className="grid grid-cols-3 gap-3 pt-2 text-xs text-muted-foreground">
          <li className="rounded-2xl bg-secondary/60 p-3 text-center">
            <span className="block font-serif text-2xl text-foreground">53</span>
            {t("stats.questions")}
          </li>
          <li className="rounded-2xl bg-secondary/60 p-3 text-center">
            <span className="block font-serif text-2xl text-foreground">2</span>
            {t("stats.partners")}
          </li>
          <li className="rounded-2xl bg-secondary/60 p-3 text-center">
            <span className="block font-serif text-2xl text-foreground">~20</span>
            {t("stats.minutes")}
          </li>
        </ul>
      </div>

      {/* Origin / book */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-5" strokeWidth={1.6} />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("book.eyebrow")}
          </p>
        </div>
        <h2 className="mt-4 font-serif text-2xl leading-tight">{t("book.title")}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t("book.body")}</p>
        <Link
          to="/$locale/foundations"
          params={{ locale }}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          {t("book.link")} <ArrowRight className="size-3.5" />
        </Link>
      </section>

      {/* Experience preview */}
      <section className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          {t("experience.eyebrow")}
        </p>
        <h2 className="font-serif text-3xl leading-tight">{t("experience.title")}</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{t("experience.body")}</p>
        <SwipePreview />
      </section>

      {/* Feedback preview */}
      <section className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("feedback.eyebrow")}</p>
        <h2 className="font-serif text-3xl leading-tight">{t("feedback.title")}</h2>
        <ResultsPreview />
        <p className="text-[15px] leading-relaxed text-muted-foreground">{t("feedback.body")}</p>
      </section>

      {/* CTA repeat */}
      <section className="rounded-3xl bg-primary/5 p-6 text-center">
        <Compass className="mx-auto size-6 text-primary" strokeWidth={1.5} />
        <p className="mt-3 font-serif text-2xl leading-tight">{t("cta.title")}</p>
        <Button
          size="lg"
          onClick={() => onChoose("create")}
          className="mt-5 h-14 w-full rounded-full text-base"
        >
          {t("cta.start")}
        </Button>
        <button
          onClick={() => onChoose("join")}
          className="mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          {t("cta.hasCode")}
        </button>
      </section>
    </div>
  );
}

function ChildrenChoice({
  value,
  onChange,
}: {
  value: ChildrenAnswer | "";
  onChange: (v: ChildrenAnswer) => void;
}) {
  const { t } = useTranslation("home");
  const options: { id: ChildrenAnswer; labelKey: string }[] = [
    { id: "yes", labelKey: "create.childrenYes" },
    { id: "maybe", labelKey: "create.childrenMaybe" },
    { id: "no", labelKey: "create.childrenNo" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-2xl border px-3 py-3 text-sm transition ${
            value === o.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:border-primary/50"
          }`}
        >
          {t(o.labelKey)}
        </button>
      ))}
    </div>
  );
}

export function CreateForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [kids, setKids] = useState<ChildrenAnswer | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !kids) return;
    setLoading(true);
    setError(null);
    try {
      const { code } = await createSession({ name, hasChildren: kids });
      rememberPartner(code, "a");
      navigate({ to: "/$locale/s/$code", params: { locale, code } });
    } catch (err: unknown) {
      setError((err as Error)?.message || t("error"));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-muted-foreground hover:text-foreground"
      >
        {t("create.back")}
      </button>
      <h2 className="text-3xl text-foreground">
        {t("create.title1")} <em className="text-primary">{t("create.title2")}</em>
      </h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("create.nameLabel")}</Label>
        <Input
          id="name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("create.namePlaceholder")}
          className="h-12 rounded-2xl bg-card"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-3">
        <Label>{t("create.childrenLabel")}</Label>
        <ChildrenChoice value={kids} onChange={setKids} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        disabled={!name.trim() || !kids || loading}
        className="h-14 rounded-full text-base"
      >
        {loading ? t("create.submitting") : t("create.submit")}
      </Button>
    </form>
  );
}

export function JoinForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kids, setKids] = useState<ChildrenAnswer | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !kids) return;
    setLoading(true);
    setError(null);
    try {
      const session = await joinSession({
        code: code.toUpperCase(),
        name,
        hasChildren: kids,
      });
      rememberPartner(session.code, "b");
      navigate({ to: "/$locale/s/$code", params: { locale, code: session.code } });
    } catch (err: unknown) {
      setError((err as Error)?.message || t("error"));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-muted-foreground hover:text-foreground"
      >
        {t("join.back")}
      </button>
      <h2 className="text-3xl text-foreground">
        {t("join.title1")} <em className="text-primary">{t("join.title2")}</em>
      </h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">{t("join.codeLabel")}</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder={t("join.codePlaceholder")}
          maxLength={4}
          className="h-14 rounded-2xl bg-card text-center font-serif text-2xl tracking-[0.4em] uppercase"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="jname">{t("join.nameLabel")}</Label>
        <Input
          id="jname"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("join.namePlaceholder")}
          className="h-12 rounded-2xl bg-card"
        />
      </div>
      <div className="flex flex-col gap-3">
        <Label>{t("join.childrenLabel")}</Label>
        <ChildrenChoice value={kids} onChange={setKids} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        disabled={!code.trim() || !name.trim() || !kids || loading}
        className="h-14 rounded-full text-base"
      >
        {loading ? t("join.submitting") : t("join.submit")}
      </Button>
    </form>
  );
}
