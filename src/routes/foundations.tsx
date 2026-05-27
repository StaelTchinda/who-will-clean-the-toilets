import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE } from "@/i18n";

// Redirect bare /foundations to the default locale version
export const Route = createFileRoute("/foundations")({
  loader: () => {
    throw redirect({
      to: "/$locale/foundations",
      params: { locale: DEFAULT_LOCALE },
      replace: true,
    });
  },
  component: () => null,
});

const ANGLE_ICONS: Record<string, typeof Compass> = {
  environment: Eye,
  talent: Hand,
  preference: Heart,
  value: Compass,
};

export function FoundationsPage() {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 pb-16 pt-[max(env(safe-area-inset-top),1.5rem)]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> retour
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-primary">
          Les fondations
        </p>
        <h1 className="mt-3 text-pretty font-serif text-4xl leading-[1.05]">
          Pourquoi parler des rôles <em className="text-primary">avant</em> qu'ils
          ne deviennent un conflit.
        </h1>

        {/* Origin */}
        <section className="mt-10 rounded-3xl border border-border bg-card p-6">
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
            Dans son livre éponyme, Gary Chapman — l'auteur des Langages de
            l'amour — observe que la majorité des tensions de couple ne viennent
            pas des grands sujets (l'argent, la famille, le sexe) mais des
            <em> petites tâches du quotidien</em> que personne n'a jamais
            explicitement attribuées. Le problème : chacun arrive avec ses
            modèles inconscients, ses talents, ses préférences, ses valeurs — et
            personne n'en parle, jusqu'à ce que ça explose.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            <em>Nos Rôles</em> est l'outil qui force cette conversation, de
            manière structurée, ludique et bienveillante.
          </p>
        </section>

        {/* The four angles */}
        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Les 4 angles d'analyse
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">
            Chaque tâche est regardée sous quatre angles.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Chapman insiste : assumer une tâche, ce n'est pas qu'une question de
            qui sait faire. C'est aussi qui a vu ses parents la faire, qui la
            tolère, et qui pense qu'elle est importante.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {ANGLES.map((a, i) => {
              const Icon = ANGLE_ICONS[a.id];
              return (
                <li
                  key={a.id}
                  className="rounded-3xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-3xl text-primary/40">
                      0{i + 1}
                    </span>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/70 text-primary">
                      <Icon className="size-5" strokeWidth={1.6} />
                    </div>
                    <h3 className="font-serif text-xl">{a.label}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Domains */}
        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Les 6 domaines
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">
            Six terrains de friction quotidiens.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Le questionnaire couvre tout ce qui fait tourner un foyer — et que
            personne ne pense à attribuer avant que ça grince.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {DOMAINS.map((d) => {
              const Icon = DOMAIN_ICON[d.id];
              return (
                <li
                  key={d.id}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" strokeWidth={1.6} />
                  </div>
                  <span className="font-serif text-lg leading-tight">
                    {d.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* What you'll discover */}
        <section className="mt-10 rounded-3xl bg-secondary/40 p-6">
          <h2 className="font-serif text-2xl leading-tight">
            À la fin, vous verrez :
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-[15px] text-foreground">
            <li className="flex gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-converge" />
              <span><strong className="font-medium">Vos convergences</strong> — les sujets où vous êtes déjà alignés, sans le savoir.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-diverge" />
              <span><strong className="font-medium">Vos divergences</strong> — les zones où une vraie conversation est nécessaire.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span><strong className="font-medium">Une répartition suggérée</strong> — basée sur les talents et préférences de chacun, pas sur les habitudes héritées.</span>
            </li>
          </ul>
        </section>

        <Link
          to="/"
          className="mt-10 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base text-primary-foreground"
        >
          Démarrer le questionnaire
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
