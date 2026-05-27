import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
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

function SwipePreview() {
  return (
    <div className="relative rounded-3xl border border-border bg-card p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
        Aperçu · Ménage · Environnement
      </p>
      <div className="mx-auto mt-4 grid max-w-[300px] grid-cols-3 grid-rows-3 items-center gap-2">
        {/* top */}
        <div className="col-start-2 row-start-1 flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-background px-2 py-2 text-[10px]">
          <ArrowUp className="size-3 opacity-60" />
          <Users className="size-4" strokeWidth={1.6} />
          <span>Les deux</span>
        </div>
        {/* left */}
        <div className="col-start-1 row-start-2 flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-background px-1.5 py-2 text-[10px]">
          <ArrowLeft className="size-3 opacity-60" />
          <UsersRound className="size-4" strokeWidth={1.6} />
          <span>Tous</span>
        </div>
        {/* card */}
        <div className="col-start-2 row-start-2 aspect-[3/4] flex flex-col items-center justify-center rounded-2xl border border-border bg-secondary/40 p-3 shadow-sm">
          <Sparkles className="size-6 text-primary" strokeWidth={1.4} />
          <p className="mt-2 text-center font-serif text-[13px] leading-tight text-foreground">
            Le ménage, chez toi en grandissant ?
          </p>
        </div>
        {/* right */}
        <div className="col-start-3 row-start-2 flex flex-col items-center gap-0.5 rounded-2xl border-2 border-primary bg-primary px-1.5 py-2 text-[10px] text-primary-foreground">
          <ArrowRight className="size-3 opacity-80" />
          <User className="size-4" strokeWidth={1.6} />
          <span>Papa</span>
        </div>
        {/* bottom */}
        <div className="col-start-2 row-start-3 flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-background px-2 py-2 text-[10px]">
          <ArrowDown className="size-3 opacity-60" />
          <PersonStanding className="size-4" strokeWidth={1.6} />
          <span>Maman</span>
        </div>
      </div>
    </div>
  );
}

function ResultsPreview() {
  const rows = [
    { label: "Cuisine quotidienne", tone: "converge", text: "Accord" },
    { label: "Sanitaires", tone: "diverge", text: "À discuter" },
    { label: "Budget courses", tone: "converge", text: "Accord" },
    { label: "Planifier les menus", tone: "diverge", text: "À discuter" },
  ] as const;
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Aperçu · résultats</span>
        <Heart className="size-3.5 text-primary" />
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-border/60">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between py-2.5 text-sm">
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
        Et une <strong className="text-foreground">répartition suggérée</strong> selon vos talents
        et préférences combinés.
      </div>
    </div>
  );
}


export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Nos Rôles — questionnaire de couple" },
      {
        name: "description",
        content:
          "Un questionnaire à deux pour révéler vos attentes, talents et préférences sur la gestion du foyer.",
      },
    ],
  }),
});

type Mode = "intro" | "create" | "join";

function HomePage() {
  const [mode, setMode] = useState<Mode>("intro");

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Nos Rôles
          </p>
        </header>

        {mode === "intro" && <Intro onChoose={setMode} />}
        {mode === "create" && <CreateForm onBack={() => setMode("intro")} />}
        {mode === "join" && <JoinForm onBack={() => setMode("intro")} />}

        <footer className="mt-auto pt-10 text-xs text-muted-foreground">
          Inspiré de « Les toilettes ne se nettoient pas toutes seules » — Gary
          Chapman.
        </footer>
      </div>
    </main>
  );
}

function Intro({ onChoose }: { onChoose: (m: Mode) => void }) {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <div className="flex flex-col gap-6">
        <h1 className="text-pretty text-5xl leading-[1.02] text-foreground">
          Vos rôles dans
          <br />
          <em className="text-primary">le foyer.</em>
        </h1>
        <p className="text-balance text-base leading-relaxed text-muted-foreground">
          Un questionnaire à deux pour révéler vos attentes, talents et
          préférences — avant que les toilettes ne deviennent un sujet.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            size="lg"
            className="h-14 rounded-full text-base"
            onClick={() => onChoose("create")}
          >
            Démarrer un questionnaire
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-14 rounded-full text-base"
            onClick={() => onChoose("join")}
          >
            Rejoindre avec un code
          </Button>
        </div>
        <ul className="grid grid-cols-3 gap-3 pt-2 text-xs text-muted-foreground">
          <li className="rounded-2xl bg-secondary/60 p-3 text-center">
            <span className="block font-serif text-2xl text-foreground">53</span>
            questions
          </li>
          <li className="rounded-2xl bg-secondary/60 p-3 text-center">
            <span className="block font-serif text-2xl text-foreground">2</span>
            partenaires
          </li>
          <li className="rounded-2xl bg-secondary/60 p-3 text-center">
            <span className="block font-serif text-2xl text-foreground">~20</span>
            minutes
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
            D'après Gary Chapman
          </p>
        </div>
        <h2 className="mt-4 font-serif text-2xl leading-tight">
          « Les toilettes ne se nettoient pas toutes seules »
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          L'auteur des Langages de l'amour observe que la plupart des conflits
          de couple ne portent pas sur l'argent ou la famille, mais sur les
          <em> petites tâches du quotidien</em> que personne n'a jamais
          explicitement attribuées. Ce questionnaire reprend sa méthode — quatre
          angles, six domaines — pour vous éviter dix ans de friction.
        </p>
        <Link
          to="/foundations"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Lire les fondations <ArrowRight className="size-3.5" />
        </Link>
      </section>

      {/* Experience preview */}
      <section className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          L'expérience
        </p>
        <h2 className="font-serif text-3xl leading-tight">
          Glisse pour répondre.
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Chaque question s'incarne en icônes. Tu glisses la carte vers ta
          réponse — haut, droite, bas, gauche — ou tu tapes. Plus rapide qu'un
          formulaire, plus parlant qu'une liste.
        </p>
        <SwipePreview />
      </section>

      {/* Feedback preview */}
      <section className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          Le retour
        </p>
        <h2 className="font-serif text-3xl leading-tight">
          Vos points d'accord, et là où ça frotte.
        </h2>
        <ResultsPreview />
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          À la fin, vous découvrez vos convergences, vos divergences, et une
          répartition suggérée basée sur les talents et préférences de chacun —
          pas sur les habitudes héritées.
        </p>
      </section>

      {/* CTA repeat */}
      <section className="rounded-3xl bg-primary/5 p-6 text-center">
        <Compass className="mx-auto size-6 text-primary" strokeWidth={1.5} />
        <p className="mt-3 font-serif text-2xl leading-tight">
          Prêt à mettre des mots dessus ?
        </p>
        <Button
          size="lg"
          onClick={() => onChoose("create")}
          className="mt-5 h-14 w-full rounded-full text-base"
        >
          Démarrer un questionnaire
        </Button>
        <button
          onClick={() => onChoose("join")}
          className="mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          j'ai déjà un code →
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
  const options: { id: ChildrenAnswer; label: string }[] = [
    { id: "yes", label: "Oui" },
    { id: "maybe", label: "Peut-être" },
    { id: "no", label: "Non" },
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
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CreateForm({ onBack }: { onBack: () => void }) {
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
      navigate({ to: "/s/$code", params: { code } });
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue");
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
        ← retour
      </button>
      <h2 className="text-3xl text-foreground">
        D'abord, <em className="text-primary">toi.</em>
      </h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Ton prénom</Label>
        <Input
          id="name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Camille"
          className="h-12 rounded-2xl bg-card"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-3">
        <Label>Avez-vous des enfants, ou souhaitez-vous en avoir ?</Label>
        <ChildrenChoice value={kids} onChange={setKids} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        disabled={!name.trim() || !kids || loading}
        className="h-14 rounded-full text-base"
      >
        {loading ? "…" : "Créer le questionnaire"}
      </Button>
    </form>
  );
}

function JoinForm({ onBack }: { onBack: () => void }) {
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
      navigate({ to: "/s/$code", params: { code: session.code } });
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue");
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
        ← retour
      </button>
      <h2 className="text-3xl text-foreground">
        Rejoindre <em className="text-primary">ton partenaire.</em>
      </h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code de session</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="A7K2"
          maxLength={4}
          className="h-14 rounded-2xl bg-card text-center font-serif text-2xl tracking-[0.4em] uppercase"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="jname">Ton prénom</Label>
        <Input
          id="jname"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          className="h-12 rounded-2xl bg-card"
        />
      </div>
      <div className="flex flex-col gap-3">
        <Label>Avez-vous des enfants, ou souhaitez-vous en avoir ?</Label>
        <ChildrenChoice value={kids} onChange={setKids} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        disabled={!code.trim() || !name.trim() || !kids || loading}
        className="h-14 rounded-full text-base"
      >
        {loading ? "…" : "Rejoindre"}
      </Button>
    </form>
  );
}
