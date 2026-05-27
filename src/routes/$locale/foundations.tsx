import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ANGLES, DOMAINS } from "@/lib/dataset";
import { iconByName } from "@/lib/icon-map";
import { Compass, Eye, Hand, Heart, BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import i18n, { type Locale } from "@/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/hooks/use-locale";

export const Route = createFileRoute("/$locale/foundations")({
  component: FoundationsPage,
  head: ({ params }) => {
    const t = i18n.getFixedT(params.locale as Locale, "foundations");
    return {
      meta: [{ title: t("meta.title") }, { name: "description", content: t("meta.description") }],
    };
  },
});

const ANGLE_ICONS: Record<string, typeof Compass> = {
  environment: Eye,
  talent: Hand,
  preference: Heart,
  value: Compass,
};

export function FoundationsPage() {
  const { t } = useTranslation("foundations");
  const { t: tData } = useTranslation("data");
  const locale = useLocale();

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 pb-16 pt-[max(env(safe-area-inset-top),1.5rem)]">
        <div className="flex items-center justify-between">
          <Link
            to="/$locale"
            params={{ locale: locale as Locale }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {t("back")}
          </Link>
          <LanguageSwitcher />
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.25em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-3 text-pretty font-serif text-4xl leading-[1.05]">
          {t("title1")} <em className="text-primary">{t("titleEm")}</em> {t("title2")}
        </h1>

        {/* Origin */}
        <section className="mt-10 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="size-5" strokeWidth={1.6} />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("book.eyebrow")}
            </p>
          </div>
          <h2 className="mt-4 font-serif text-2xl leading-tight">{t("book.title")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {t("book.body1")}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            <em>{t("book.body2")}</em>
          </p>
        </section>

        {/* The four angles */}
        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("angles.eyebrow")}</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">{t("angles.title")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {t("angles.body")}
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {ANGLES.map((a, i) => {
              const Icon = ANGLE_ICONS[a.id];
              return (
                <li key={a.id} className="rounded-3xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-3xl text-primary/40">0{i + 1}</span>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/70 text-primary">
                      <Icon className="size-5" strokeWidth={1.6} />
                    </div>
                    <h3 className="font-serif text-xl">
                      {tData(`angles.${a.id}.label`, { defaultValue: a.label })}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {tData(`angles.${a.id}.description`, { defaultValue: a.description })}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Domains */}
        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("domains.eyebrow")}</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">{t("domains.title")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {t("domains.body")}
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {DOMAINS.map((d) => {
              const Icon = iconByName(d.icon);
              return (
                <li
                  key={d.id}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" strokeWidth={1.6} />
                  </div>
                  <span className="font-serif text-lg leading-tight">
                    {tData(`domains.${d.id}`, { defaultValue: d.label })}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* What you'll discover */}
        <section className="mt-10 rounded-3xl bg-secondary/40 p-6">
          <h2 className="font-serif text-2xl leading-tight">{t("results.title")}</h2>
          <ul className="mt-4 flex flex-col gap-3 text-[15px] text-foreground">
            <li className="flex gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-converge" />
              <span>
                <strong className="font-medium">{t("results.convergences.label")}</strong>
                {" — "}
                {t("results.convergences.detail")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-diverge" />
              <span>
                <strong className="font-medium">{t("results.divergences.label")}</strong>
                {" — "}
                {t("results.divergences.detail")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>
                <strong className="font-medium">{t("results.suggestion.label")}</strong>
                {" — "}
                {t("results.suggestion.detail")}
              </span>
            </li>
          </ul>
        </section>

        <Link
          to="/$locale"
          params={{ locale: locale as Locale }}
          className="mt-10 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base text-primary-foreground"
        >
          {t("cta")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
