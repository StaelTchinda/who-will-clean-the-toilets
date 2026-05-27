import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Sparkles,
  Heart,
  Users,
  PersonStanding,
  User,
  UsersRound,
  BookOpen,
  Compass,
} from "lucide-react";
import {
  createSession,
  joinSession,
  rememberPartner,
  type ChildrenAnswer,
} from "@/lib/session";
import i18n, { type Locale } from "@/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/$locale/")({
  component: HomePage,
  head: ({ params }) => {
    const t = i18n.getFixedT(params.locale as Locale, "home");
    return {
      meta: [
        { title: t("meta.title") },
        { name: "description", content: t("meta.description") },
      ],
    };
  },
});

function SwipePreview() {
  const { t } = useTranslation("home");
  return (
    <div className="relative rounded-3xl border border-border bg-card p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
        {t("swipePreview.eyebrow")}
      </p>
      <div className="mx-auto mt-4 grid max-w-[300px] grid-cols-3 grid-rows-3 items-center gap-2">
        {/* top */}
        <div className="col-start-2 row-start-1 flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-background px-2 py-2 text-[10px]">
          <ArrowUp className="size-3 opacity-60" />
          <Users className="size-4" strokeWidth={1.6} />
          <span>{t("swipePreview.both")}</span>
        </div>
        {/* left */}
        <div className="col-start-1 row-start-2 flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-background px-1.5 py-2 text-[10px]">
          <ArrowLeft className="size-3 opacity-60" />
          <UsersRound className="size-4" strokeWidth={1.6} />
          <span>{t("swipePreview.everyone")}</span>
        </div>
        {/* card */}
        <div className="col-start-2 row-start-2 aspect-[3/4] flex flex-col items-center justify-center rounded-2xl border border-border bg-secondary/40 p-3 shadow-sm">
          <Sparkles className="size-6 text-primary" strokeWidth={1.4} />
          <p className="mt-2 text-center font-serif text-[13px] leading-tight text-foreground">
            {t("swipePreview.question")}
          </p>
        </div>
        {/* right */}
        <div className="col-start-3 row-start-2 flex flex-col items-center gap-0.5 rounded-2xl border-2 border-primary bg-primary px-1.5 py-2 text-[10px] text-primary-foreground">
          <ArrowRight className="size-3 opacity-80" />
          <User className="size-4" strokeWidth={1.6} />
          <span>{t("swipePreview.papa")}</span>
        </div>
        {/* bottom */}
        <div className="col-start-2 row-start-3 flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-background px-2 py-2 text-[10px]">
          <ArrowDown className="size-3 opacity-60" />
          <PersonStanding className="size-4" strokeWidth={1.6} />
          <span>{t("swipePreview.maman")}</span>
        </div>
      </div>
    </div>
  );
}

function ResultsPreview() {
  const { t } = useTranslation("home");
  const rows = [
    { label: t("domains.cooking_daily") || "Cuisine quotidienne", tone: "converge", text: t("resultPreview.converge") },
    { label: t("domains.sanitizing") || "Sanitaires", tone: "diverge", text: t("resultPreview.diverge") },
    { label: t("domains.budget") || "Budget courses", tone: "converge", text: t("resultPreview.converge") },
    { label: t("domains.meal_planning") || "Planifier les menus", tone: "diverge", text: t("resultPreview.diverge") },
  ] as const;
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{t("resultPreview.eyebrow")}</span>
        <Heart className="size-3.5 text-primary" />
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-border/60">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between py-2.5 text-sm">
            <span className="font-serif text-[15px]">{r.label}</span>
            <span
              className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${
                r.tone === "converge" ? "text-converge" : "text-diverge"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  r.tone === "converge" ? "bg-converge" : "bg-diverge"
                }`}
              />
              {r.text}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
        {t("resultPreview.suggestion")}
      </div>
    </div>
  );
}

type Mode = "intro" | "create" | "join";

function HomePage() {
  const { t } = useTranslation("home");
  const { locale } = Route.useParams();
  const [mode, setMode] = useState<Mode>("intro");

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            {t("brand")}
          </p>
          <LanguageSwitcher />
        </header>

        {mode === "intro" && <Intro onChoose={setMode} locale={locale as Locale} />}
        {mode === "create" && <CreateForm onBack={() => setMode("intro")} locale={locale as Locale} />}
        {mode === "join" && <JoinForm onBack={() => setMode("intro")} locale={locale as Locale} />}

        <footer className="mt-auto pt-10 text-xs text-muted-foreground">
          {t("footer")}
        </footer>
      </div>
    </main>
  );
}

function Intro({ onChoose, locale }: { onChoose: (m: Mode) => void; locale: Locale }) {
  const { t } = useTranslation("home");
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
        <h2 className="mt-4 font-serif text-2xl leading-tight">
          {t("book.title")}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {t("book.body")}
        </p>
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
        <h2 className="font-serif text-3xl leading-tight">
          {t("experience.title")}
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {t("experience.body")}
        </p>
        <SwipePreview />
      </section>

      {/* Feedback preview */}
      <section className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          {t("feedback.eyebrow")}
        </p>
        <h2 className="font-serif text-3xl leading-tight">
          {t("feedback.title")}
        </h2>
        <ResultsPreview />
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {t("feedback.body")}
        </p>
      </section>

      {/* CTA repeat */}
      <section className="rounded-3xl bg-primary/5 p-6 text-center">
        <Compass className="mx-auto size-6 text-primary" strokeWidth={1.5} />
        <p className="mt-3 font-serif text-2xl leading-tight">
          {t("cta.title")}
        </p>
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

function CreateForm({ onBack, locale }: { onBack: () => void; locale: Locale }) {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
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

function JoinForm({ onBack, locale }: { onBack: () => void; locale: Locale }) {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
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
